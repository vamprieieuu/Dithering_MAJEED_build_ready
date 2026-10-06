#!/usr/bin/env python3
"""
Comprehensive Adobe After Effects Plugin Verification Script
Used in GitHub Actions and local builds to verify PE, exports, and resources.
"""
import sys
import struct
import hashlib
import os

def verify_aex(path):
    print(f"\n==========================================")
    print(f"VERIFYING AFTER EFFECTS PLUGIN: {path}")
    print(f"==========================================")

    if not os.path.exists(path):
        print(f"ERROR: File does not exist: {path}")
        return False

    size = os.path.getsize(path)
    print(f"File Size: {size} bytes ({round(size / 1024, 2)} KB)")
    if size < 50 * 1024:
        print(f"ERROR: File size is suspiciously small ({size} bytes)")
        return False

    with open(path, 'rb') as f:
        data = f.read()

    sha256 = hashlib.sha256(data).hexdigest()
    print(f"SHA-256: {sha256}")

    # 1. PE Magic
    if len(data) < 0x40 or data[:2] != b'MZ':
        print("ERROR: Not a valid DOS/MZ executable")
        return False

    e_lfanew = struct.unpack('<I', data[0x3c:0x40])[0]
    if len(data) < e_lfanew + 24 or data[e_lfanew:e_lfanew+4] != b'PE\x00\x00':
        print("ERROR: Not a valid PE executable")
        return False

    # 2. Machine
    machine = struct.unpack('<H', data[e_lfanew+4:e_lfanew+6])[0]
    num_sections = struct.unpack('<H', data[e_lfanew+6:e_lfanew+8])[0]
    opt_hdr_size = struct.unpack('<H', data[e_lfanew+20:e_lfanew+22])[0]
    characteristics = struct.unpack('<H', data[e_lfanew+22:e_lfanew+24])[0]

    if machine != 0x8664:
        print(f"ERROR: Architecture must be x64 (0x8664), found: {hex(machine)}")
        return False
    print("✓ Architecture: AMD64 / x64 (0x8664)")

    # DLL Characteristic
    if not (characteristics & 0x2000):
        print(f"ERROR: File does not have IMAGE_FILE_DLL characteristic ({hex(characteristics)})")
        return False
    print("✓ File Characteristics: Valid DLL (0x2000)")

    # 3. Optional Header
    opt_offset = e_lfanew + 24
    magic = struct.unpack('<H', data[opt_offset:opt_offset+2])[0]
    if magic != 0x20b:
        print(f"ERROR: Expected PE32+ (0x20b), found: {hex(magic)}")
        return False
    print("✓ PE Format: PE32+ (64-bit)")

    subsystem = struct.unpack('<H', data[opt_offset+68:opt_offset+70])[0]
    subsys_maj = struct.unpack('<H', data[opt_offset+44:opt_offset+46])[0]
    subsys_min = struct.unpack('<H', data[opt_offset+46:opt_offset+48])[0]

    if subsystem != 2:
        print(f"ERROR: Subsystem must be WINDOWS_GUI (2), found: {subsystem}")
        return False
    print(f"✓ Subsystem: WINDOWS_GUI (2)")

    if subsys_maj < 6:
        print(f"ERROR: Subsystem version is {subsys_maj}.{subsys_min} (expected 6.0)")
        return False
    print(f"✓ Subsystem Version: {subsys_maj}.{subsys_min}")

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
        print("ERROR: No Export Directory found!")
        return False

    exp_off = rva_to_off(export_rva)
    if not exp_off:
        print("ERROR: Cannot resolve Export Directory RVA!")
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
        print("ERROR: EffectMain is NOT in export table!")
        return False
    print("✓ Entry point: EffectMain is exported")

    if 'PluginDataEntryFunction2' not in exported_names:
        print("ERROR: PluginDataEntryFunction2 is NOT in export table!")
        return False
    print("✓ Entry point: PluginDataEntryFunction2 is exported")

    # Check for unwanted MinGW / GCC symbols
    unwanted = [fn for fn in exported_names if any(w in fn for w in ['GCC', 'Unwind', 'emutls', '_ZN', '__gnu'])]
    if unwanted:
        print(f"ERROR: Found {len(unwanted)} unwanted compiler/internal exports: {unwanted}")
        return False
    print("✓ Clean exports: No MinGW/GCC internal symbols leaked")

    # 5. Resources / PiPL Verification
    if not rsrc_section:
        print("ERROR: No .rsrc section found in PE!")
        return False

    # Check for PiPL signature in .rsrc
    rsrc_data = data[rsrc_section['raw_ptr'] : rsrc_section['raw_ptr'] + rsrc_section['raw_size']]
    if b'MIB8dnik' not in rsrc_data and b'8BIMkind' not in rsrc_data:
        print("ERROR: PiPL signature ('MIB8dnik' or '8BIMkind') NOT found in .rsrc!")
        return False
    print("✓ Resources: PiPL signature validated in .rsrc")

    if b'EffectMain' not in rsrc_data:
        print("ERROR: EffectMain entry point reference not found in PiPL resource!")
        return False
    print("✓ Resources: EffectMain entry point referenced in PiPL")

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
