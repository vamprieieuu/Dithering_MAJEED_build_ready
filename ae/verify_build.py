#!/usr/bin/env python3
"""
Comprehensive Adobe After Effects Plugin Verification Script
Used in GitHub Actions and local builds to verify PE, exports, and resources.
"""
import sys
import struct
import hashlib
import os

# Ensure stdout handles encoding gracefully without throwing charmap errors
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

def verify_aex(path):
    print(f"\n==========================================")
    print(f"VERIFYING AFTER EFFECTS PLUGIN: {path}")
    print(f"==========================================")

    if not os.path.exists(path):
        print(f"[FAIL] File does not exist: {path}")
        return False

    size = os.path.getsize(path)
    print(f"File Size: {size} bytes ({round(size / 1024, 2)} KB)")
    if size < 50 * 1024:
        print(f"[FAIL] File size is suspiciously small ({size} bytes)")
        return False

    with open(path, 'rb') as f:
        data = f.read()

    sha256 = hashlib.sha256(data).hexdigest().upper()
    print(f"SHA-256: {sha256}")

    # 1. PE Magic
    if len(data) < 0x40 or data[:2] != b'MZ':
        print("[FAIL] Not a valid DOS/MZ executable")
        return False

    e_lfanew = struct.unpack('<I', data[0x3c:0x40])[0]
    if len(data) < e_lfanew + 24 or data[e_lfanew:e_lfanew+4] != b'PE\x00\x00':
        print("[FAIL] Not a valid PE executable")
        return False

    # 2. Machine
    machine = struct.unpack('<H', data[e_lfanew+4:e_lfanew+6])[0]
    num_sections = struct.unpack('<H', data[e_lfanew+6:e_lfanew+8])[0]
    opt_hdr_size = struct.unpack('<H', data[e_lfanew+20:e_lfanew+22])[0]
    characteristics = struct.unpack('<H', data[e_lfanew+22:e_lfanew+24])[0]

    if machine != 0x8664:
        print(f"[FAIL] Architecture must be x64 (0x8664), found: {hex(machine)}")
        return False
    print("[OK] Architecture: AMD64 / x64 (0x8664)")

    # DLL Characteristic
    if not (characteristics & 0x2000):
        print(f"[FAIL] File does not have IMAGE_FILE_DLL characteristic ({hex(characteristics)})")
        return False
    print("[OK] File Characteristics: Valid DLL (0x2000)")

    # 3. Optional Header
    opt_offset = e_lfanew + 24
    magic = struct.unpack('<H', data[opt_offset:opt_offset+2])[0]
    if magic != 0x20b:
        print(f"[FAIL] Expected PE32+ (0x20b), found: {hex(magic)}")
        return False
    print("[OK] PE Format: PE32+ (64-bit)")

    # Read Subsystem and Versions from PE Optional Header
    try:
        import pefile
        pe = pefile.PE(data=data)
        subsystem = pe.OPTIONAL_HEADER.Subsystem
        subsys_maj = pe.OPTIONAL_HEADER.MajorSubsystemVersion
        subsys_min = pe.OPTIONAL_HEADER.MinorSubsystemVersion
    except Exception:
        # Standard PE32+ Optional Header offsets:
        # Offset 48: MajorSubsystemVersion (2 bytes)
        # Offset 50: MinorSubsystemVersion (2 bytes)
        # Offset 68: Subsystem (2 bytes)
        subsystem = struct.unpack('<H', data[opt_offset+68:opt_offset+70])[0]
        subsys_maj = struct.unpack('<H', data[opt_offset+48:opt_offset+50])[0]
        subsys_min = struct.unpack('<H', data[opt_offset+50:opt_offset+52])[0]

    if subsystem != 2:
        print(f"[FAIL] Subsystem must be WINDOWS_GUI (2), found: {subsystem}")
        return False
    print(f"[OK] Subsystem: WINDOWS_GUI (2)")

    if subsys_maj < 6:
        print(f"[FAIL] Subsystem version is {subsys_maj}.{subsys_min} (expected 6.0)")
        return False
    print(f"[OK] Subsystem Version: {subsys_maj}.{subsys_min}")

    # Parse sections
    sec_offset = opt_offset + opt_hdr_size
    sections = []
    rsrc_section = None
    for i in range(num_sections):
        s_data = data[sec_offset + i*40 : sec_offset + (i+1)*40]
        s_name = s_data[:8].rstrip(b'\x00').decode('latin1', errors='ignore')
        vsize, vaddr, raw_size, raw_ptr = struct.unpack('<IIII', s_data[8:24])
        s_char = struct.unpack('<I', s_data[36:40])[0]
        sec_info = {'name': s_name, 'vaddr': vaddr, 'raw_ptr': raw_ptr, 'vsize': vsize, 'raw_size': raw_size, 'char': s_char}
        sections.append(sec_info)
        if s_name == '.rsrc':
            rsrc_section = sec_info

    def rva_to_off(rva):
        for s in sections:
            if s['vaddr'] <= rva < s['vaddr'] + max(s['vsize'], s['raw_size']):
                return s['raw_ptr'] + (rva - s['vaddr'])
        return None

    # 4. Exports Verification
    export_rva = struct.unpack('<I', data[opt_offset + 112 : opt_offset + 116])[0]
    if export_rva == 0:
        print("[FAIL] No Export Directory found!")
        return False

    exp_off = rva_to_off(export_rva)
    if not exp_off:
        print("[FAIL] Cannot resolve Export Directory RVA!")
        return False

    _, _, _, _, name_rva, ord_base, num_funcs, num_names, funcs_rva, names_rva, ords_rva = struct.unpack(
        '<IIHHIIIIIII', data[exp_off:exp_off+40]
    )

    names_off = rva_to_off(names_rva)
    ords_off = rva_to_off(ords_rva)
    exported_names = []
    if names_off and ords_off:
        for idx in range(num_names):
            n_rva = struct.unpack('<I', data[names_off + idx*4 : names_off + (idx+1)*4])[0]
            n_off = rva_to_off(n_rva)
            fn_name = data[n_off:n_off+200].split(b'\0')[0].decode('latin1')
            exported_names.append(fn_name)

    print(f"\nExported Symbols ({len(exported_names)} total):")
    for fn in exported_names:
        print(f"  - {fn}")

    # Check required entry points
    if 'EffectMain' not in exported_names:
        print("[FAIL] EffectMain is NOT in export table!")
        return False
    print("[OK] Entry point: EffectMain is exported")

    if 'PluginDataEntryFunction2' not in exported_names:
        print("[FAIL] PluginDataEntryFunction2 is NOT in export table!")
        return False
    print("[OK] Entry point: PluginDataEntryFunction2 is exported")

    # Check for unwanted MinGW / GCC symbols
    unwanted = [fn for fn in exported_names if any(w in fn for w in ['GCC', 'Unwind', 'emutls', '_ZN', '__gnu'])]
    if unwanted:
        print(f"[FAIL] Found {len(unwanted)} unwanted compiler/internal exports: {unwanted}")
        return False
    print("[OK] Clean exports: No MinGW/GCC internal symbols leaked")

    # 4b. Imports Verification (Check static CRT runtime profile)
    import_rva = struct.unpack('<I', data[opt_offset + 120 : opt_offset + 124])[0]
    imported_dlls = []
    if import_rva:
        imp_off = rva_to_off(import_rva)
        if imp_off:
            i = 0
            while True:
                desc = data[imp_off + i*20 : imp_off + (i+1)*20]
                if not desc or desc == b'\x00' * 20:
                    break
                _, _, _, name_rva, _ = struct.unpack('<IIIII', desc)
                name_off = rva_to_off(name_rva)
                if name_off:
                    dll_name = data[name_off : data.find(b'\0', name_off)].decode('latin1', errors='ignore')
                    imported_dlls.append(dll_name)
                i += 1

    print(f"\nImported DLLs ({len(imported_dlls)} total):")
    for dll in imported_dlls:
        print(f"  - {dll}")

    dynamic_vc_dlls = [d for d in imported_dlls if any(k in d.upper() for k in ['MSVCP', 'VCRUNTIME', 'API-MS-WIN-CRT'])]
    if dynamic_vc_dlls:
        print(f"[WARN] Dynamic Visual C++ runtime DLLs imported: {dynamic_vc_dlls} (Static /MT recommended for AE standalone)")
    else:
        print("[OK] Runtime profile: Clean standalone imports (Static runtime /MT or system msvcrt)")

    # 5. Resources / PiPL Verification
    if not rsrc_section:
        print("[FAIL] No .rsrc section found in PE!")
        return False

    # Check for PiPL signature in .rsrc
    rsrc_data = data[rsrc_section['raw_ptr'] : rsrc_section['raw_ptr'] + rsrc_section['raw_size']]
    if b'MIB8dnik' not in rsrc_data and b'8BIMkind' not in rsrc_data:
        print("[FAIL] PiPL signature ('MIB8dnik' or '8BIMkind') NOT found in .rsrc!")
        return False
    print("[OK] Resources: PiPL signature validated in .rsrc")

    if b'EffectMain' not in rsrc_data:
        print("[FAIL] EffectMain entry point reference not found in PiPL resource!")
        return False
    print("[OK] Resources: EffectMain entry point referenced in PiPL")

    # Verify PiPL flags match GlobalSetup
    if b'\x04\x80\x00\x02' not in rsrc_data:
        print("[FAIL] PiPL out_flags (0x02008004) not found in PiPL resource!")
        return False
    print("[OK] Resources: PiPL out_flags (0x02008004) verified")

    if b'\x00\x14\x00\x08' not in rsrc_data:
        print("[FAIL] PiPL out_flags2 (0x08001400) not found in PiPL resource!")
        return False
    print("[OK] Resources: PiPL out_flags2 (0x08001400) verified")

    # Check for duplicate manifest
    manifest_count = rsrc_data.count(b'<assembly')
    if manifest_count > 1:
        print(f"[FAIL] Duplicate manifest detected in .rsrc! ({manifest_count} occurrences)")
        return False
    print(f"[OK] Resources: Manifest verified (occurrences: {manifest_count})")

    print("\n==========================================")
    print("ALL AEX PE & RESOURCE CRITERIA PASSED!")
    print("==========================================\n")
    return True


if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else 'dist/YMDithers_v7.aex'
    if not os.path.exists(target):
        for candidate in ['YMDithers_v7.aex', 'public/YMDithers_v7.aex', 'public/dist/YMDithers_v7.aex', 'dist/YMDithers.aex']:
            if os.path.exists(candidate):
                target = candidate
                break
    ok = verify_aex(target)
    sys.exit(0 if ok else 1)
