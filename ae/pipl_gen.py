#!/usr/bin/env python3
"""
pipl_gen.py - Robust Adobe After Effects PiPL Generator
Parses Adobe PiPL definition (.r / .rr) and generates:
1) Binary PiPL resource (.bin) matching Adobe specifications exactly.
2) Resource script (.rc) referencing the binary payload for MSVC rc.exe and MinGW windres.
"""
import os
import re
import struct
import sys

KIND_MAP = {
    "AEEffect": b"TKFe",
    "AEGP": b"pgEA",
    "AEImageFormat": b"FXIF",
    "AEAccelerator": b"eFKT",
    "AEGeneral": b"xgEA",
}


def cstr_bytes(s: str) -> bytes:
    b = s.encode("latin1") + b"\x00"
    pad = (4 - (len(b) % 4)) % 4
    return b + (b"\x00" * pad)


def pascal_bytes(s: str) -> bytes:
    raw = s.encode("latin1")
    b = bytes([len(raw)]) + raw
    pad = (4 - (len(b) % 4)) % 4
    return b + (b"\x00" * pad)


def eval_int(expr: str) -> int:
    expr = expr.strip().rstrip("L").rstrip("l")
    # Handle constants
    expr = expr.replace("PF_PLUG_IN_VERSION", "13")
    expr = expr.replace("PF_PLUG_IN_SUBVERS", "28")
    expr = expr.replace("AE_RESERVED_INFO", "8")
    return int(eval(expr, {"__builtins__": {}}))


def parse_pipl_file(filepath: str):
    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        text = f.read()

    # Strip line directives and C/C++ comments
    lines = []
    for line in text.splitlines():
        if line.lstrip().startswith("#"):
            # If line is #ifdef AE_PROC_INTELx64 or #ifdef AE_OS_WIN, keep body
            continue
        lines.append(line)
    text = "\n".join(lines)
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    text = re.sub(r"(?m)^(\s*)//[^\n]*", "", text)

    # Locate resource 'PiPL' (res_id) { { body } };
    res_match = re.search(
        r"resource\s+'PiPL'\s*\(\s*(\d+)\s*(?:,\s*\"[^\"]*\"\s*)?(?:,\s*[^)]*)?\)\s*\{\s*\{(.*?)\}\s*\}\s*;",
        text,
        re.S,
    )

    res_id = 16000
    body = text
    if res_match:
        res_id = int(res_match.group(1))
        body = res_match.group(2)

    # Parse properties
    prop_pattern = re.compile(r"([A-Za-z0-9_]+)\s*\{\s*(.*?)\s*\}\s*(?:,|$)", re.S)

    # Properties list of tuples: (ptype_4bytes, prop_id, raw_bytes)
    props = []

    for pm in prop_pattern.finditer(body):
        key = pm.group(1)
        val = pm.group(2).strip()

        if key == "Kind":
            fourcc = KIND_MAP.get(val, b"TKFe")
            props.append((b"dnik", 0, fourcc))

        elif key == "Name":
            m = re.search(r'"([^"]*)"', val)
            s = m.group(1) if m else val
            props.append((b"eman", 0, pascal_bytes(s)))

        elif key == "Category":
            m = re.search(r'"([^"]*)"', val)
            s = m.group(1) if m else val
            props.append((b"gtac", 0, pascal_bytes(s)))

        elif key in ("CodeWin64X86", "CodeWin32X86", "CodeMacIntel64", "CodeMacARM64"):
            # Only CodeWin64X86 is emitted for Windows x64
            if key == "CodeWin64X86":
                m = re.search(r'"([^"]*)"', val)
                s = m.group(1) if m else val
                props.append((b"4668", 0, cstr_bytes(s)))

        elif key == "AE_PiPL_Version":
            parts = [eval_int(p) for p in val.split(",")]
            props.append((b"RVPe", 0, struct.pack("<HH", parts[0], parts[1])))

        elif key == "AE_Effect_Spec_Version":
            parts = [eval_int(p) for p in val.split(",")]
            props.append((b"RVSe", 0, struct.pack("<HH", parts[0], parts[1])))

        elif key == "AE_Effect_Version":
            v = eval_int(val)
            props.append((b"REVe", 0, struct.pack("<I", v)))

        elif key == "AE_Effect_Info_Flags":
            v = eval_int(val)
            props.append((b"FNIe", 0, struct.pack("<H", v)))

        elif key == "AE_Effect_Global_OutFlags":
            v = eval_int(val)
            props.append((b"OLGe", 0, struct.pack("<I", v)))

        elif key == "AE_Effect_Global_OutFlags_2":
            v = eval_int(val)
            props.append((b"2LGe", 0, struct.pack("<I", v)))

        elif key == "AE_Effect_Match_Name":
            m = re.search(r'"([^"]*)"', val)
            s = m.group(1) if m else val
            props.append((b"ANMe", 0, pascal_bytes(s)))

        elif key == "AE_Reserved_Info":
            v = eval_int(val)
            props.append((b"LFea", 0, struct.pack("<I", v)))

        elif key == "AE_Effect_Support_URL":
            m = re.search(r'"([^"]*)"', val)
            s = m.group(1) if m else val
            props.append((b"LRUe", 0, pascal_bytes(s)))

    # Ensure CodeWin64X86 is present for x64 Windows
    has_code = any(p[0] == b"4668" for p in props)
    if not has_code:
        # Insert after category
        idx = 3 if len(props) >= 3 else len(props)
        props.insert(idx, (b"4668", 0, cstr_bytes("EffectMain")))

    # Header: version=1 (uint16), reserved=0 (uint32), count (uint32)
    header = struct.pack("<HII", 1, 0, len(props))

    body_bytes = bytearray()
    for ptype, num, val in props:
        raw_size = len(val)
        pad = (4 - (raw_size % 4)) % 4
        padded_val = val + (b"\x00" * pad)
        # Property header: magic "MIB8", type (4), ID (4), size (4)
        prop_hdr = b"MIB8" + ptype + struct.pack("<II", num, raw_size)
        body_bytes.extend(prop_hdr)
        body_bytes.extend(padded_val)

    binary_data = header + bytes(body_bytes)
    return res_id, binary_data


def generate_pipl(source_path: str, rc_path: str, bin_path: str = None):
    if bin_path is None:
        bin_path = os.path.splitext(rc_path)[0] + ".bin"

    res_id, bin_data = parse_pipl_file(source_path)

    # Write binary file
    with open(bin_path, "wb") as f:
        f.write(bin_data)

    bin_filename = os.path.basename(bin_path)

    # Write RC file
    rc_content = f"""// Generated by pipl_gen.py for Adobe After Effects - DO NOT EDIT
#ifdef _WIN32
LANGUAGE 9, 1 // LANG_ENGLISH, SUBLANG_ENGLISH_US
#pragma code_page(1252)
#endif

{res_id} PIPL "{bin_filename}"
"""

    with open(rc_path, "w", encoding="utf-8") as f:
        f.write(rc_content)

    print(f"[pipl_gen] Successfully generated {rc_path} ({len(rc_content)} bytes) and {bin_path} ({len(bin_data)} bytes, {res_id} PIPL)")


def main():
    if len(sys.argv) < 3:
        sys.stderr.write("Usage: pipl_gen.py source_r output_rc [output_bin]\n")
        sys.exit(1)

    source_path = sys.argv[1]
    rc_path = sys.argv[2]
    bin_path = sys.argv[3] if len(sys.argv) > 3 else None

    generate_pipl(source_path, rc_path, bin_path)


if __name__ == "__main__":
    main()
