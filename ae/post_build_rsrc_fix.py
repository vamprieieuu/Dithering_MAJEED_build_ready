#!/usr/bin/env python3
import sys
import struct
import pefile

def fix_pe(path):
    print(f"Applying post-build fixes to: {path}")
    pe = pefile.PE(path)

    # 1. Set Subsystem to Windows GUI (2)
    pe.OPTIONAL_HEADER.Subsystem = 2 # IMAGE_SUBSYSTEM_WINDOWS_GUI
    pe.OPTIONAL_HEADER.MajorSubsystemVersion = 6
    pe.OPTIONAL_HEADER.MinorSubsystemVersion = 0

    # 2. Fix .rsrc section characteristics to read-only initialized data
    # (IMAGE_SCN_MEM_READ | IMAGE_SCN_CNT_INITIALIZED_DATA = 0x40000040)
    for section in pe.sections:
        sec_name = section.Name.decode('latin1', errors='ignore').strip('\x00')
        if sec_name == '.rsrc':
            old_char = section.Characteristics
            section.Characteristics = 0x40000040
            print(f"Updated .rsrc characteristics: {hex(old_char)} -> {hex(section.Characteristics)}")

    pe.write(path)
    pe.close()
    print("Post-build PE fixes successfully applied.")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: post_build_rsrc_fix.py <file.aex>")
        sys.exit(1)
    fix_pe(sys.argv[1])
