#!/usr/bin/env python3
"""
Exact Python implementation of Adobe's PiPLtool.exe (.rr -> .rrc) for cross-compilation
when running on a non-Windows host. Produces the identical .rrc format as PiPLtool.exe.
"""
import re
import sys

KIND_MAP = {
    "AEEffect": "TKFe",
    "AEGP": "pgEA",
    "AEImageFormat": "FXIF",
    "AEAccelerator": "eFKT",
    "AEGeneral": "xgEA",
}


def pascal_padded(s: str):
    raw_len = len(s)
    total = raw_len + 1
    rem = total % 4
    pad = (4 - rem) if rem != 0 else 0
    total += pad
    return total, f"\\x{raw_len:02X}{s}" + ("\\0" * pad)


def cstr_padded(s: str):
    raw_len = len(s)
    total = raw_len + 1
    rem = total % 4
    pad = (4 - rem) if rem != 0 else 0
    total += pad
    return total, f"{s}\\0" + ("\\0" * pad)


def eval_int(expr: str) -> int:
    expr = expr.strip()
    return int(eval(expr, {"__builtins__": {}}))


def convert_rr_to_rrc(rr_text: str) -> str:
    # Strip preprocessor line directives and C/C++ comments (without stripping // inside quotes)
    lines = []
    for line in rr_text.splitlines():
        if line.lstrip().startswith("#"):
            continue
        lines.append(line)
    text = "\n".join(lines)
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    text = re.sub(r'(?m)^(\s*)//[^\n]*', "", text)

    out = [
        "#ifndef _H_ResTypes",
        "#define _H_ResTypes",
        "",
        "#define RSCL32(a,b,c,d)\t\t0x ## c ## d, 0x ## a ## b",
        "#define RSCS32(a)\t\ta, 0x0",
        "",
        "#endif",
    ]

    res_pattern = re.compile(
        r"resource\s+'PiPL'\s*\(\s*(\d+)\s*(?:,\s*\"[^\"]*\"\s*)?(?:,\s*[^)]*)?\)\s*\{\s*\{(.*?)\}\s*\}\s*;",
        re.S,
    )

    prop_pattern = re.compile(r"([A-Za-z0-9_]+)\s*\{\s*(.*?)\s*\}\s*(?:,|$)", re.S)

    for res_match in res_pattern.finditer(text):
        res_id = int(res_match.group(1))
        body = res_match.group(2)

        props_out = []
        prop_count = 0

        for pm in prop_pattern.finditer(body):
            key = pm.group(1)
            val = pm.group(2).strip()

            if key == "Kind":
                fourcc = KIND_MAP.get(val, "TKFe")
                props_out.extend([
                    '\t"MIB8",',
                    '\t"dnik", /* \'kind\' PIKindProperty*/',
                    "\tRSCS32(0),",
                    "\tRSCS32(4),",
                    f'\t"{fourcc}",',
                ])
                prop_count += 1
            elif key == "Name":
                s = re.search(r'"([^"]*)"', val).group(1)
                total, encoded = pascal_padded(s)
                props_out.extend([
                    '\t"MIB8",',
                    '\t"eman",/* \'name\' PINameProperty */',
                    "\tRSCS32(0),",
                    f"\tRSCS32({total}),",
                    f'\t"{encoded}", ',
                ])
                prop_count += 1
            elif key == "Category":
                s = re.search(r'"([^"]*)"', val).group(1)
                total, encoded = pascal_padded(s)
                props_out.extend([
                    '\t"MIB8",',
                    '\t"gtac", /* \'catg\' PICategoryProperty */',
                    "\tRSCS32(0),",
                    f"\tRSCS32({total}),",
                    f'\t"{encoded}", ',
                ])
                prop_count += 1
            elif key == "CodeWin64X86":
                s = re.search(r'"([^"]*)"', val).group(1)
                total, encoded = cstr_padded(s)
                props_out.extend([
                    '\t"MIB8",',
                    '\t"4668", /* \'8664\' PIWin64X86CodeProperty */',
                    "\tRSCS32(0),",
                    f"\tRSCS32({total}),",
                    f'\t"{encoded}", ',
                ])
                prop_count += 1
            elif key == "CodeWin32X86":
                s = re.search(r'"([^"]*)"', val).group(1)
                total, encoded = cstr_padded(s)
                props_out.extend([
                    '\t"MIB8",',
                    '\t"68xw", /* \'wx86\' PIWin32X86CodeProperty */',
                    "\tRSCS32(0),",
                    f"\tRSCS32({total}),",
                    f'\t"{encoded}", ',
                ])
                prop_count += 1
            elif key == "AE_PiPL_Version":
                parts = [eval_int(p) for p in val.split(",")]
                props_out.extend([
                    '\t"MIB8",',
                    '\t"RVPe", /* \'eSVR\' PIFmtMaxSizeProperty */',
                    "\tRSCS32(0),",
                    "\tRSCS32(4),",
                    f"\t{parts[0]}, {parts[1]},",
                ])
                prop_count += 1
            elif key == "AE_Effect_Spec_Version":
                parts = [eval_int(p) for p in val.split(",")]
                props_out.extend([
                    '\t"MIB8",',
                    '\t"RVSe", /* \'eSVR\' PIFmtMaxSizeProperty */',
                    "\tRSCS32(0),",
                    "\tRSCS32(4),",
                    f"\t{parts[0]}, {parts[1]},",
                ])
                prop_count += 1
            elif key == "AE_Effect_Version":
                v = eval_int(val)
                props_out.extend([
                    '\t"MIB8",',
                    "\t0x65564552L, /* 'eVER' */",
                    "\t0L,",
                    "\t4L,",
                    f"\t{v}L, ",
                ])
                prop_count += 1
            elif key == "AE_Effect_Info_Flags":
                v = eval_int(val)
                props_out.extend([
                    '\t"MIB8",',
                    "\t0x65494E46L, /* 'eINF' */",
                    "\t0L,",
                    "\t2L,",
                    f"\t{v}L, ",
                ])
                prop_count += 1
            elif key == "AE_Effect_Global_OutFlags":
                v = eval_int(val)
                props_out.extend([
                    '\t"MIB8",',
                    '\t"OLGe", /* \'eGLO\' */',
                    "\t0L,",
                    "\t4L,",
                    f"\t{v}L, ",
                ])
                prop_count += 1
            elif key == "AE_Effect_Global_OutFlags_2":
                v = eval_int(val)
                props_out.extend([
                    '\t"MIB8",',
                    '\t"2LGe", /* \'eGL2\' */',
                    "\t0L,",
                    "\t4L,",
                    f"\t{v}L, ",
                ])
                prop_count += 1
            elif key == "AE_Effect_Match_Name":
                s = re.search(r'"([^"]*)"', val).group(1)
                total, encoded = pascal_padded(s)
                props_out.extend([
                    '\t"MIB8",',
                    '\t"ANMe",/* \'name\' PINameProperty */',
                    "\tRSCS32(0),",
                    f"\tRSCS32({total}),",
                    f'\t"{encoded}", ',
                ])
                prop_count += 1
            elif key == "AE_Reserved_Info":
                v = eval_int(val)
                props_out.extend([
                    '\t"MIB8",',
                    "\t0x6165464CL, /* 'aeFL' */",
                    "\t0L,",
                    "\t4L,",
                    f"\t{v}L, ",
                ])
                prop_count += 1
            elif key == "AE_Effect_Support_URL":
                s = re.search(r'"([^"]*)"', val).group(1)
                total, encoded = pascal_padded(s)
                props_out.extend([
                    '\t"MIB8",',
                    '\t"LRUe",/* \'eURL\' */',
                    "\tRSCS32(0),",
                    f"\tRSCS32({total}),",
                    f'\t"{encoded}", ',
                ])
                prop_count += 1

        out.append(f"{res_id}  PiPL  DISCARDABLE")
        out.append("BEGIN")
        out.append("\t0x0001,\t /* Must always be the first Byte */")
        out.append("\tRSCS32(0), \t/* kCurrentPiPLVersion */")
        out.append(f"\tRSCS32({prop_count:3d}), /* Property Count */")
        out.extend(props_out)
        out.append("")
        out.append("END")
        out.append("")

    return "\n".join(out) + "\n"


def main():
    if len(sys.argv) != 3:
        sys.stderr.write("Usage: pipl_gen.py sourcefile destinationfile\n")
        sys.exit(1)
    with open(sys.argv[1], "r", encoding="utf-8", errors="replace") as f:
        rr = f.read()
    rrc = convert_rr_to_rrc(rr)
    with open(sys.argv[2], "w", encoding="utf-8") as f:
        f.write(rrc)


if __name__ == "__main__":
    main()
