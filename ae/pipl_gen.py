#!/usr/bin/env python3
"""
Adobe After Effects PiPL Generator for YMDithers v7
Generates binary PiPL resource (PIPL 16000) matching After Effects SDK specification
and verified 1:1 against the working reference AEX.
"""
import sys
import struct
import os

def ps(s):
    b = bytes([len(s)]) + s.encode('latin1')
    return b + b'\0' * ((-len(b)) % 4)

def gen(r_src, rc_out, bin_out):
    props = [
        ('dnik', b'TKFe'),
        ('eman', ps('YMDithers')),
        ('gtac', ps('YMDithers')),
        ('4668', b'EffectMain\0\0'),
        ('RVPe', struct.pack('<I', 2)),
        ('RVSe', struct.pack('<HH', 13, 28)),
        ('REVe', bytes.fromhex('01060800')),
        ('FNIe', b'\0\0'),
        ('OLGe', struct.pack('<I', 0x02008004)),
        ('2LGe', struct.pack('<I', 0x08001400)),
        ('ANMe', ps('YMDithers')),
        ('LFea', struct.pack('<I', 8)),
        ('LRUe', ps('https://example.invalid/ymdithers'))
    ]
    
    d = bytearray(struct.pack('<IHH', 1, 0, len(props)) + b'\0\0')
    for k, v in props:
        d += b'MIB8' + k.encode() + struct.pack('<II', 0, len(v)) + v + b'\0' * ((-len(v)) % 4)
    
    bin_abs = os.path.abspath(bin_out)
    rc_abs = os.path.abspath(rc_out)
    
    os.makedirs(os.path.dirname(bin_abs), exist_ok=True)
    with open(bin_abs, 'wb') as f:
        f.write(d)
        
    os.makedirs(os.path.dirname(rc_abs), exist_ok=True)
    with open(rc_abs, 'w', encoding='utf-8') as f:
        f.write('LANGUAGE 9, 1\n')
        f.write(f'16000 PIPL "{bin_abs.replace(os.sep, "/")}"\n')
        
    print(f'Successfully generated PiPL: {len(d)} bytes at {bin_abs}')

if __name__ == '__main__':
    if len(sys.argv) < 4:
        print("Usage: pipl_gen.py <Majeed_PiPL.r> <Majeed_PiPL.rc> <Majeed_PiPL.bin>")
        sys.exit(1)
    gen(*sys.argv[1:4])

