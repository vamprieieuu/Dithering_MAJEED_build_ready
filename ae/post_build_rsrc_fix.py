#!/usr/bin/env python3
"""
post_build_rsrc_fix.py - Post-build verifier and patcher for YMDithers.aex
Ensures:
1. .rsrc section has read-only characteristics (0x40000040)
2. Subsystem is Windows GUI (2)
3. MajorSubsystemVersion is >= 6
4. Validates PE32+ x64 architecture, EffectMain export, and PIPL 16000 resource.
"""
import os
import struct
import sys

IMAGE_SUBSYSTEM_WINDOWS_GUI = 2
IMAGE_SCN_MEM_READ = 0x40000000
IMAGE_SCN_MEM_WRITE = 0x80000000
IMAGE_SCN_CNT_INITIALIZED_DATA = 0x00000040


def fix_and_verify(filepath):
    if not os.path.exists(filepath):
        print(f"[post_build_fix] ERROR: File not found: {filepath}", file=sys.stderr)
        return False

    with open(filepath, "r+b") as f:
        data = f.read()

        # DOS Header
        if data[:2] != b"MZ":
            print(f"[post_build_fix] ERROR: Not a PE executable: {filepath}", file=sys.stderr)
            return False

        e_lfanew = struct.unpack_from("<I", data, 0x3C)[0]
        if data[e_lfanew:e_lfanew+4] != b"PE\x00\x00":
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

        # Subsystem & Subsystem Version in Optional Header
        # Standard: 24 bytes, Windows-specific:
        # Subsystem is at opt_offset + 68 (MajorSubsystemVersion is at opt_offset + 44)
        subsys_off = opt_offset + 68
        maj_subsys_off = opt_offset + 44

        curr_subsys = struct.unpack_from("<H", data, subsys_off)[0]
        if curr_subsys != IMAGE_SUBSYSTEM_WINDOWS_GUI:
            f.seek(subsys_off)
            f.write(struct.pack("<H", IMAGE_SUBSYSTEM_WINDOWS_GUI))
            print(f"[post_build_fix] Patched Subsystem: 0x{curr_subsys:04x} -> 0x{IMAGE_SUBSYSTEM_WINDOWS_GUI:04x} (GUI)")

        curr_maj_subsys = struct.unpack_from("<H", data, maj_subsys_off)[0]
        if curr_maj_subsys < 6:
            f.seek(maj_subsys_off)
            f.write(struct.pack("<H", 6))
            print(f"[post_build_fix] Patched MajorSubsystemVersion: {curr_maj_subsys} -> 6")

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
            sections.append((name, va, vsize, rptr, rsize, chars))

            if name == ".rsrc":
                rsrc_found = True
                new_chars = (chars & ~IMAGE_SCN_MEM_WRITE) | IMAGE_SCN_MEM_READ | IMAGE_SCN_CNT_INITIALIZED_DATA
                if new_chars != chars:
                    f.seek(chars_off)
                    f.write(struct.pack("<I", new_chars))
                    print(f"[post_build_fix] Fixed .rsrc characteristics: 0x{chars:08x} -> 0x{new_chars:08x}")
                else:
                    print(f"[post_build_fix] .rsrc characteristics already read-only: 0x{chars:08x}")

        if not rsrc_found:
            print(f"[post_build_fix] WARNING: .rsrc section not found in {filepath}", file=sys.stderr)

    # Re-read for validation
    with open(filepath, "rb") as f:
        data = f.read()

    def rva_to_offset(rva):
        for name, va, vsize, rptr, rsize, chars in sections:
            if va <= rva < va + max(vsize, rsize):
                return rptr + (rva - va)
        return None

    # Verify Exports
    exp_rva, exp_size = struct.unpack_from("<II", data, e_lfanew + 24 + 112)
    exports = []
    if exp_rva:
        exp_off = rva_to_offset(exp_rva)
        if exp_off:
            num_names = struct.unpack_from("<I", data, exp_off + 24)[0]
            names_rva = struct.unpack_from("<I", data, exp_off + 32)[0]
            names_off = rva_to_offset(names_rva)
            if names_off:
                for i in range(num_names):
                    nrva = struct.unpack_from("<I", data, names_off + i * 4)[0]
                    noff = rva_to_offset(nrva)
                    if noff:
                        end = data.find(b"\x00", noff)
                        exports.append(data[noff:end].decode("latin1", errors="replace"))

    print(f"[post_build_fix] Exports found: {exports}")
    if "EffectMain" not in exports:
        print(f"[post_build_fix] ERROR: 'EffectMain' NOT found in exports!", file=sys.stderr)
        return False

    # Verify Resources (Type 'PIPL' ID 16000)
    rsrc_rva, rsrc_size = struct.unpack_from("<II", data, e_lfanew + 24 + 128)
    pipl_found = False
    if rsrc_rva:
        rsrc_base = rva_to_offset(rsrc_rva)
        if rsrc_base:
            c_named, c_id = struct.unpack_from("<HH", data, rsrc_base + 12)
            for i in range(c_named + c_id):
                type_entry = rsrc_base + 16 + i * 8
                type_id, type_sub = struct.unpack_from("<II", data, type_entry)
                type_name = ""
                if type_id & 0x80000000:
                    toff = rsrc_base + (type_id & 0x7FFFFFFF)
                    tlen = struct.unpack_from("<H", data, toff)[0]
                    type_name = data[toff + 2 : toff + 2 + tlen * 2].decode("utf-16le", errors="replace")

                if type_name.upper() == "PIPL":
                    tdir = rsrc_base + (type_sub & 0x7FFFFFFF)
                    nc_named, nc_id = struct.unpack_from("<HH", data, tdir + 12)
                    for j in range(nc_named + nc_id):
                        nent = tdir + 16 + j * 8
                        nid, nsub = struct.unpack_from("<II", data, nent)
                        if nid == 16000:
                            ndir = rsrc_base + (nsub & 0x7FFFFFFF)
                            lc_named, lc_id = struct.unpack_from("<HH", data, ndir + 12)
                            for k in range(lc_named + lc_id):
                                lent = ndir + 16 + k * 8
                                lid, dleaf_off = struct.unpack_from("<II", data, lent)
                                dleaf = rsrc_base + (dleaf_off & 0x7FFFFFFF)
                                drva, dsize = struct.unpack_from("<II", data, dleaf)
                                print(f"[post_build_fix] VERIFIED PIPL: ID 16000, Size={dsize} bytes, RVA=0x{drva:x}")
                                pipl_found = True

    if not pipl_found:
        print(f"[post_build_fix] ERROR: PIPL resource (16000) NOT found in {filepath}!", file=sys.stderr)
        return False

    print(f"[post_build_fix] SUCCESS: {filepath} verified valid x64 After Effects plugin.")
    return True


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.stderr.write("Usage: post_build_rsrc_fix.py <path_to_aex>\n")
        sys.exit(1)

    target = sys.argv[1]
    ok = fix_and_verify(target)
    sys.exit(0 if ok else 1)
