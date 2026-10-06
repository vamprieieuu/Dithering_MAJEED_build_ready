#!/usr/bin/env python3
import sys
import struct
import os

def generate_pipl(r_path, rc_path, bin_path):
    props = []

    # 0. Kind: 'eFKT' (After Effects effect)
    props.append(('8BIM', 'kind', 0, b'eFKT'))

    # 1. Name: Pascal string (1 byte length + ASCII) padded to 4 bytes
    name_str = "YMDithers"
    p_name = bytes([len(name_str)]) + name_str.encode('latin1')
    pad = (4 - (len(p_name) % 4)) % 4
    props.append(('8BIM', 'name', 0, p_name + b'\x00' * pad))

    # 2. Category: Pascal string padded to 4 bytes
    cat_str = "YMDithers"
    p_cat = bytes([len(cat_str)]) + cat_str.encode('latin1')
    pad = (4 - (len(p_cat) % 4)) % 4
    props.append(('8BIM', 'catg', 0, p_cat + b'\x00' * pad))

    # 3. Entry point: Win64 code ('8664') -> C-string null-terminated padded to 4 bytes
    entry_str = b"EffectMain\x00"
    pad = (4 - (len(entry_str) % 4)) % 4
    props.append(('8BIM', '8664', 0, entry_str + b'\x00' * pad))

    # 4. PiPL version: 2
    props.append(('8BIM', 'ePVR', 0, struct.pack('>I', 2)))

    # 5. Effect spec version: 13.28 (AE 2023 / 23.2.1)
    props.append(('8BIM', 'eSVR', 0, struct.pack('>HH', 13, 28)))

    # 6. Effect version: 1.6.8 (0x00010608)
    props.append(('8BIM', 'eVER', 0, struct.pack('>I', 0x00010608)))

    # 7. Info flags: 0
    props.append(('8BIM', 'eINF', 0, struct.pack('>H', 0) + b'\x00\x00'))

    # 8. Global out flags: 0x02008004
    # (PF_OutFlag_DEEP_COLOR_AWARE | PF_OutFlag_WIDE_TIME_INPUT | PF_OutFlag_PIX_INDEPENDENT)
    props.append(('8BIM', 'eGLO', 0, struct.pack('>I', 0x02008004)))

    # 9. Global out flags 2: 0x08001400
    # (PF_OutFlag2_FLOAT_COLOR_AWARE | PF_OutFlag2_SUPPORTS_SMART_RENDER | PF_OutFlag2_SUPPORTS_THREADED_RENDERING)
    props.append(('8BIM', 'eGL2', 0, struct.pack('>I', 0x08001400)))

    # 10. Match name: Pascal string padded to 4 bytes
    mna_str = "YMDithers"
    p_mna = bytes([len(mna_str)]) + mna_str.encode('latin1')
    pad = (4 - (len(p_mna) % 4)) % 4
    props.append(('8BIM', 'eMNA', 0, p_mna + b'\x00' * pad))

    # 11. Reserved flags: 8
    props.append(('8BIM', 'aeFL', 0, struct.pack('>I', 8)))

    # 12. Support URL: Pascal string padded to 4 bytes
    url_str = "https://example.invalid/ymdithers"
    p_url = bytes([len(url_str)]) + url_str.encode('latin1')
    pad = (4 - (len(p_url) % 4)) % 4
    props.append(('8BIM', 'eURL', 0, p_url + b'\x00' * pad))

    # Assemble Adobe big-endian PiPL binary data
    bin_data = bytearray()
    bin_data += struct.pack('>II', 1, len(props))

    for vendor, key, pid, data in props:
        bin_data += vendor.encode('latin1')
        bin_data += key.encode('latin1')
        bin_data += struct.pack('>II', pid, len(data))
        bin_data += data

    # Write bin
    os.makedirs(os.path.dirname(os.path.abspath(bin_path)), exist_ok=True)
    with open(bin_path, 'wb') as f:
        f.write(bin_data)

    # Write rc
    bin_norm = bin_path.replace('\\', '/')
    rc_content = f'16000 PIPL "{bin_norm}"\n'
    os.makedirs(os.path.dirname(os.path.abspath(rc_path)), exist_ok=True)
    with open(rc_path, 'w', encoding='utf-8') as f:
        f.write(rc_content)

    print(f"Generated PiPL: {bin_path} ({len(bin_data)} bytes), {rc_path}")

if __name__ == '__main__':
    if len(sys.argv) < 4:
        print("Usage: pipl_gen.py <input.r> <output.rc> <output.bin>")
        sys.exit(1)
    generate_pipl(sys.argv[1], sys.argv[2], sys.argv[3])
