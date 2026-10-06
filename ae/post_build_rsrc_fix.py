#!/usr/bin/env python3
import sys
import struct
import os

def fix_pe(path):
    print(f"Applying post-build fixes to: {path}")
    
    # Try using pefile if available, otherwise use pure-Python binary parser
    try:
        import pefile
        pe = pefile.PE(path)
        pe.OPTIONAL_HEADER.Subsystem = 2 # IMAGE_SUBSYSTEM_WINDOWS_GUI
        pe.OPTIONAL_HEADER.MajorSubsystemVersion = 6
        pe.OPTIONAL_HEADER.MinorSubsystemVersion = 0
        for section in pe.sections:
            sec_name = section.Name.decode('latin1', errors='ignore').strip('\x00')
            if sec_name == '.rsrc':
                old_char = section.Characteristics
                section.Characteristics = 0x40000040
                print(f"Updated .rsrc characteristics via pefile: {hex(old_char)} -> {hex(section.Characteristics)}")
        pe.write(path)
        pe.close()
        print("Post-build PE fixes successfully applied (pefile).")
        return
    except ImportError:
        print("pefile module not found; using built-in binary PE editor.")

    with open(path, 'r+b') as f:
        data = bytearray(f.read())
        if len(data) < 0x40 or data[:2] != b'MZ':
            print("Not a valid MZ executable.")
            return

        e_lfanew = int.from_bytes(data[0x3c:0x40], 'little')
        if len(data) < e_lfanew + 24 or data[e_lfanew:e_lfanew+4] != b'PE\x00\x00':
            print("Not a valid PE executable.")
            return

        num_sections = int.from_bytes(data[e_lfanew+6:e_lfanew+8], 'little')
        size_opt = int.from_bytes(data[e_lfanew+20:e_lfanew+22], 'little')
        opt_offset = e_lfanew + 24

        # 1. Set Subsystem (offset 68 in Optional Header) to 2 (IMAGE_SUBSYSTEM_WINDOWS_GUI)
        if size_opt >= 70:
            data[opt_offset + 44 : opt_offset + 46] = (6).to_bytes(2, 'little') # MajorSubsystemVersion = 6
            data[opt_offset + 46 : opt_offset + 48] = (0).to_bytes(2, 'little') # MinorSubsystemVersion = 0
            data[opt_offset + 68 : opt_offset + 70] = (2).to_bytes(2, 'little') # Subsystem = 2 (GUI)
            print("Set PE Subsystem to Windows GUI (2) and SubsystemVersion to 6.0")

        # 2. Fix .rsrc characteristics to 0x40000040 (read-only initialized data)
        sec_offset = opt_offset + size_opt
        for i in range(num_sections):
            cur = sec_offset + i * 40
            sec_name = data[cur : cur + 8].rstrip(b'\x00').decode('latin1', errors='ignore')
            if sec_name == '.rsrc':
                old_char = int.from_bytes(data[cur + 36 : cur + 40], 'little')
                new_char = 0x40000040
                data[cur + 36 : cur + 40] = new_char.to_bytes(4, 'little')
                print(f"Updated .rsrc characteristics: {hex(old_char)} -> {hex(new_char)}")

        f.seek(0)
        f.write(data)
        f.truncate()
        print("Post-build PE fixes successfully applied (built-in binary).")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: post_build_rsrc_fix.py <file.aex>")
        sys.exit(1)
    fix_pe(sys.argv[1])
