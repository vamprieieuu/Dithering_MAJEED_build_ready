#!/usr/bin/env python3
import sys,struct,os
def ps(s):
 b=bytes([len(s)])+s.encode('latin1'); return b+b'\0'*((-len(b))%4)
def gen(r,rc,bin):
 props=[('dnik',b'TKFe'),('eman',ps('YMDithers')),('gtac',ps('YMDithers')),('4668',b'EffectMain\0\0'),('RVPe',struct.pack('<I',2)),('RVSe',struct.pack('<HH',13,28)),('REVe',bytes.fromhex('01060800')),('FNIe',b'\0\0'),('OLGe',struct.pack('<I',0x02008004)),('2LGe',struct.pack('<I',0x08001400)),('ANMe',ps('YMDithers')),('LFea',struct.pack('<I',8)),('LRUe',ps('https://example.invalid/ymdithers'))]
 d=bytearray(struct.pack('<IHH',1,0,len(props))+b'\0\0')
 for k,v in props: d+=b'MIB8'+k.encode()+struct.pack('<II',0,len(v))+v+b'\0'*((-len(v))%4)
 os.makedirs(os.path.dirname(os.path.abspath(bin)),exist_ok=True); open(bin,'wb').write(d); os.makedirs(os.path.dirname(os.path.abspath(rc)),exist_ok=True); open(rc,'w').write('16000 PIPL "'+bin.replace('\\','/')+'"\n'); print('PiPL',len(d),'bytes')
if __name__=='__main__': gen(*sys.argv[1:4])
