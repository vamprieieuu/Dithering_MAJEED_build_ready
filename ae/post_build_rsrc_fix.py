#!/usr/bin/env python3
"""
post_build_rsrc_fix.py - Post-build verifier and patcher for YMDithers.aex
Ensures:
1. .rsrc section has read-only characteristics (0x40000040)
2. Every section's SizeOfRawData is aligned to FileAlignment (0x200)
3. Subsystem is Windows GUI (2), never CUI (3)
4. OS / Image / Subsystem version fields in PE32+ OptionalHeader are >= 6.0
5. Windows PE CheckSum is recomputed and verified after any header modifications
6. Validates PE32+ x64 architecture, exact exports (EffectMain, PluginDataEntryFunction2),
   single RT_MANIFEST (ID 2), and complete PIPL 16000 resource structure.
"""
import os
import struct
import sys

IMAGE_SUBSYSTEM_WINDOWS_GUI = 2
IMAGE_SCN_MEM_READ = 0x40000000
IMAGE_SCN_MEM_WRITE = 0x80000000
IMAGE_SCN_CNT_INITIALIZED_DATA = 0x00000040


def compute_pe_checksum(data: bytes, checksum_off: int) -> int:
    buf = bytearray(data)
    buf[checksum_off : checksum_off + 4] = b"\x00\x00\x00\x00"
    if len(buf) % 2 != 0:
        buf.append(0)
    chk = 0
    words = struct.unpack(f"<{len(buf) // 2}H", buf)
    for w in words:
        chk += w
        chk = (chk & 0xFFFF) + (chk >> 16)
    chk = (chk & 0xFFFF) + (chk >> 16)
    return (chk + len(data)) & 0xFFFFFFFF


def fix_and_verify(filepath: str) -> bool:
    if not os.path.exists(filepath):
        print(f"[post_build_fix] ERROR: File not found: {filepath}", file=sys.stderr)
        return False

    with open(filepath, "rb") as f:
        data = bytearray(f.read())

    # DOS Header
    if data[:2] != b"MZ":
        print(f"[post_build_fix] ERROR: Not a PE executable: {filepath}", file=sys.stderr)
        return False

    e_lfanew = struct.unpack_from("<I", data, 0x3C)[0]
    if data[e_lfanew : e_lfanew + 4] != b"PE\x00\x00":
        print(f"[post_build_fix] ERROR: Invalid PE signature in {filepath}", file=sys.stderr)
        return False

    machine = struct.unpack_from("<H", data, e_lfanew + 4)[0]
    if machine != 0x8664:
        print(f"[post_build_fix] ERROR: Not an x64 PE (Machine=0x{machine:04x}) in {filepath}", file=sys.stderr)
        return False

    num_sections = struct.unpack_from("<H", data, e_lfanew + 6)[0]
    opt_size = struct.unpack_from("<H", data, e_lfanew + 20)[0]
    opt_offset = e_lfanew + 24
    opt_magic = struct.unpack_from("<H", data, opt_offset)[0]

    if opt_magic != 0x20B:  # PE32+
        print(f"[post_build_fix] ERROR: Not a PE32+ 64-bit binary (magic=0x{opt_magic:04x}) in {filepath}", file=sys.stderr)
        return False

    file_align = struct.unpack_from("<I", data, opt_offset + 36)[0]

    # PE32+ Optional Header version & subsystem offsets:
    # +40: MajorOperatingSystemVersion (uint16), +42: MinorOperatingSystemVersion (uint16)
    # +44: MajorImageVersion (uint16),           +46: MinorImageVersion (uint16)
    # +48: MajorSubsystemVersion (uint16),       +50: MinorSubsystemVersion (uint16)
    # +64: CheckSum (uint32)
    # +68: Subsystem (uint16)
    os_ver_off = opt_offset + 40
    img_ver_off = opt_offset + 44
    subsys_ver_off = opt_offset + 48
    checksum_off = opt_offset + 64
    subsys_off = opt_offset + 68

    curr_subsys = struct.unpack_from("<H", data, subsys_off)[0]
    if curr_subsys != IMAGE_SUBSYSTEM_WINDOWS_GUI:
        struct.pack_into("<H", data, subsys_off, IMAGE_SUBSYSTEM_WINDOWS_GUI)
        print(f"[post_build_fix] Patched Subsystem: 0x{curr_subsys:04x} -> 0x{IMAGE_SUBSYSTEM_WINDOWS_GUI:04x} (GUI)")

    maj_os, min_os = struct.unpack_from("<HH", data, os_ver_off)
    if maj_os < 6:
        struct.pack_into("<HH", data, os_ver_off, 6, 0)
        print(f"[post_build_fix] Patched OSVersion: {maj_os}.{min_os} -> 6.0")

    maj_img, min_img = struct.unpack_from("<HH", data, img_ver_off)
    if maj_img < 6:
        struct.pack_into("<HH", data, img_ver_off, 6, 0)
        print(f"[post_build_fix] Patched ImageVersion: {maj_img}.{min_img} -> 6.0")

    maj_sub, min_sub = struct.unpack_from("<HH", data, subsys_ver_off)
    if maj_sub < 6 or (maj_sub == 6 and min_sub != 0):
        struct.pack_into("<HH", data, subsys_ver_off, 6, 0)
        print(f"[post_build_fix] Patched SubsystemVersion: {maj_sub}.{min_sub} -> 6.0")

    # Section Headers
    sec_offset = opt_offset + opt_size
    rsrc_found = False
    sections = []

    for i in range(num_sections):
        sec_entry = sec_offset + i * 40
        name = data[sec_entry : sec_entry + 8].rstrip(b"\x00").decode("latin1", errors="replace")
        vsize, va, rsize, rptr = struct.unpack_from("<IIII", data, sec_entry + 8)
        chars_off = sec_entry + 36
        chars = struct.unpack_from("<I", data, chars_off)[0]

        # Ensure SizeOfRawData is a multiple of FileAlignment (fixes GNU ld .rsrc unaligned RSize bug)
        if rsize > 0 and (rsize % file_align) != 0:
            aligned_rsize = ((rsize + file_align - 1) // file_align) * file_align
            if rptr + aligned_rsize <= len(data):
                struct.pack_into("<I", data, sec_entry + 16, aligned_rsize)
                print(f"[post_build_fix] Aligned {name} SizeOfRawData: 0x{rsize:06x} -> 0x{aligned_rsize:06x}")
                rsize = aligned_rsize

        if name == ".rsrc":
            rsrc_found = True
            new_chars = (chars & ~IMAGE_SCN_MEM_WRITE) | IMAGE_SCN_MEM_READ | IMAGE_SCN_CNT_INITIALIZED_DATA
            if new_chars != chars:
                struct.pack_into("<I", data, chars_off, new_chars)
                print(f"[post_build_fix] Fixed .rsrc characteristics: 0x{chars:08x} -> 0x{new_chars:08x}")
                chars = new_chars
            else:
                print(f"[post_build_fix] .rsrc characteristics already read-only: 0x{chars:08x}")

        sections.append((name, va, vsize, rptr, rsize, chars))

    if not rsrc_found:
        print(f"[post_build_fix] ERROR: .rsrc section not found in {filepath}", file=sys.stderr)
        return False

    # Recompute and store valid PE CheckSum
    new_checksum = compute_pe_checksum(data, checksum_off)
    struct.pack_into("<I", data, checksum_off, new_checksum)
    print(f"[post_build_fix] Updated PE CheckSum: 0x{new_checksum:08x}")

    with open(filepath, "wb") as f:
        f.write(data)

    # Re-read for strict verification
    with open(filepath, "rb") as f:
        vdata = f.read()

    verify_chk = compute_pe_checksum(vdata, checksum_off)
    stored_chk = struct.unpack_from("<I", vdata, checksum_off)[0]
    if verify_chk != stored_chk:
        print(f"[post_build_fix] ERROR: CheckSum mismatch (stored=0x{stored_chk:x}, computed=0x{verify_chk:x})", file=sys.stderr)
        return False

    def rva_to_offset(rva):
        for name, va, vsize, rptr, rsize, chars in sections:
            if va <= rva < va + max(vsize, rsize):
                return rptr + (rva - va)
        return None

    # Verify Exports
    exp_rva, exp_size = struct.unpack_from("<II", vdata, opt_offset + 112)
    exports = []
    if exp_rva:
        exp_off = rva_to_offset(exp_rva)
        if exp_off:
            num_names = struct.unpack_from("<I", vdata, exp_off + 24)[0]
            names_rva = struct.unpack_from("<I", vdata, exp_off + 32)[0]
            names_off = rva_to_offset(names_rva)
            if names_off:
                for i in range(num_names):
                    nrva = struct.unpack_from("<I", vdata, names_off + i * 4)[0]
                    noff = rva_to_offset(nrva)
                    if noff:
                        end = vdata.find(b"\x00", noff)
                        exports.append(vdata[noff:end].decode("latin1", errors="replace"))

    print(f"[post_build_fix] Exports found: {exports}")
    if exports != ["EffectMain", "PluginDataEntryFunction2"]:
        print(f"[post_build_fix] ERROR: Unexpected exports {exports}!", file=sys.stderr)
        return False

    # Verify Resources: PIPL (ID 16000) and single RT_MANIFEST (Type 24, ID 2)
    rsrc_rva, rsrc_size = struct.unpack_from("<II", vdata, opt_offset + 128)
    pipl_found = False
    manifest_ids = []
    if rsrc_rva:
        rsrc_base = rva_to_offset(rsrc_rva)
        if rsrc_base:
            c_named, c_id = struct.unpack_from("<HH", vdata, rsrc_base + 12)
            for i in range(c_named + c_id):
                type_entry = rsrc_base + 16 + i * 8
                type_id, type_sub = struct.unpack_from("<II", vdata, type_entry)
                type_name = ""
                if type_id & 0x80000000:
                    toff = rsrc_base + (type_id & 0x7FFFFFFF)
                    tlen = struct.unpack_from("<H", vdata, toff)[0]
                    type_name = vdata[toff + 2 : toff + 2 + tlen * 2].decode("utf-16le", errors="replace")

                tdir = rsrc_base + (type_sub & 0x7FFFFFFF)
                nc_named, nc_id = struct.unpack_from("<HH", vdata, tdir + 12)

                if type_id == 24:  # RT_MANIFEST
                    for j in range(nc_named + nc_id):
                        nent = tdir + 16 + j * 8
                        nid, _ = struct.unpack_from("<II", vdata, nent)
                        manifest_ids.append(nid)

                if type_name.upper() == "PIPL":
                    for j in range(nc_named + nc_id):
                        nent = tdir + 16 + j * 8
                        nid, nsub = struct.unpack_from("<II", vdata, nent)
                        if nid == 16000:
                            ndir = rsrc_base + (nsub & 0x7FFFFFFF)
                            lc_named, lc_id = struct.unpack_from("<HH", vdata, ndir + 12)
                            for k in range(lc_named + lc_id):
                                lent = ndir + 16 + k * 8
                                lid, dleaf_off = struct.unpack_from("<II", vdata, lent)
                                dleaf = rsrc_base + (dleaf_off & 0x7FFFFFFF)
                                drva, dsize = struct.unpack_from("<II", vdata, dleaf)
                                poff = rva_to_offset(drva)
                                pdata = vdata[poff : poff + dsize]
                                ver, rev, cnt = struct.unpack_from("<HII", pdata, 0)
                                print(f"[post_build_fix] VERIFIED PIPL: ID 16000, Size={dsize} bytes, RVA=0x{drva:x}, Props={cnt}")
                                if ver == 1 and cnt == 13:
                                    pipl_found = True

    if manifest_ids != [2]:
        print(f"[post_build_fix] ERROR: Expected exactly one RT_MANIFEST ID 2, found {manifest_ids}!", file=sys.stderr)
        return False
    print(f"[post_build_fix] VERIFIED RT_MANIFEST: IDs={manifest_ids} (single DLL manifest)")

    if not pipl_found:
        print(f"[post_build_fix] ERROR: Valid PIPL resource (16000) NOT found in {filepath}!", file=sys.stderr)
        return False

    print(f"[post_build_fix] SUCCESS: {filepath} verified valid x64 After Effects 23.2.1 plugin.")
    return True


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.stderr.write("Usage: post_build_rsrc_fix.py <path_to_aex>\n")
        sys.exit(1)

    target = sys.argv[1]
    ok = fix_and_verify(target)
    sys.exit(0 if ok else 1)
