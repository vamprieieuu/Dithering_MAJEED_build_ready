#!/usr/bin/env python3
import sys
import struct

def fix_rsrc_characteristics(filepath):
    try:
        with open(filepath, "r+b") as f:
            data = f.read()
            e_lfanew = struct.unpack_from("<I", data, 0x3c)[0]
            num_sections = struct.unpack_from("<H", data, e_lfanew + 6)[0]
            opt_size = struct.unpack_from("<H", data, e_lfanew + 20)[0]
            sec_offset = e_lfanew + 24 + opt_size
            for i in range(num_sections):
                name = data[sec_offset + i*40 : sec_offset + i*40 + 8].rstrip(b"\x00").decode("latin1")
                if name == ".rsrc":
                    chars_off = sec_offset + i*40 + 36
                    cv = struct.unpack_from("<I", data, chars_off)[0]
                    # Clear IMAGE_SCN_MEM_WRITE (0x80000000), set IMAGE_SCN_MEM_READ | IMAGE_SCN_CNT_INITIALIZED_DATA (0x40000040)
                    nv = (cv & ~0x80000000) | 0x40000040
                    f.seek(chars_off)
                    f.write(struct.pack("<I", nv))
                    print(f"[post_build_rsrc_fix] Fixed .rsrc characteristics in {filepath}: 0x{cv:08x} -> 0x{nv:08x}")
                    return True
        print(f"[post_build_rsrc_fix] Warning: .rsrc section not found in {filepath}")
    except Exception as ex:
        print(f"[post_build_rsrc_fix] Notice: {ex}")
    return False

if __name__ == "__main__":
    if len(sys.argv) > 1:
        fix_rsrc_characteristics(sys.argv[1])
