#!/usr/bin/env python3
"""
Ingest the Anil Kumar Jain "Chakra_Adhyaya_1to8" digitization (8 legacy .xls files,
one per Adhyaya of Khanda 1) into this decoder's grid format.

Each source sheet lists 729 cells per chakra down the rows (rows 2..730), one column
per chakra (header ids like `Chakra_1.2.1`). Cell values are the manuscript's 1..64
ank-script numerals. This script linearises each chakra row-major (the orientation
verified to match the repo's existing `chapters/1/chakra_1.txt`, 729/729) and writes
`chapters/<A>/chakra_<M>.txt` in the same comma-separated form the decoder reads via
`SequenceFile.readLine(.., Encoding.numerical)`.

Transcription artifacts (stray punctuation, OCR noise, dash-merged tokens) are handled:
  - a token reducible to a single in-range integer is recovered (e.g. "`35"->35, "54_"->54)
  - anything genuinely ambiguous ("47-1", "-", "Q", blanks) is filled with 1 (the
    manuscript's most common value; the decoder rejects out-of-range values, so a valid
    placeholder is required) and logged in INGEST_REPORT.md.

Requires `xlrd` (read-only .xls). Run in a venv, not globally:
    python3 -m venv .venv && .venv/bin/pip install xlrd
    .venv/bin/python tools/ingest_chakra_xls.py --src <dir-with-xls> --out ../decoder/data

This is a one-off data-prep utility, separate from the TypeScript decoder.
"""
import argparse
import os
import re
import sys

try:
    import xlrd
except ImportError:
    sys.exit("xlrd is required: python3 -m venv .venv && .venv/bin/pip install xlrd")

# Adhyaya (chapter) name -> (number, sheet holding the grid columns)
ADHYAYAS = [
    ("One", 1, "Chapter-1"),
    ("Two", 2, "Sheet1"),
    ("Three", 3, "Sheet1"),
    ("Four", 4, "Sheet1"),
    ("Five", 5, "Sheet1"),
    ("Six", 6, "Sheet1"),
    ("Seven", 7, "Sheet1"),
    ("Eight", 8, "Sheet1"),
]

GPL_HEADER = (
    "# Copyright (C) 2025 Aruhant Mehta\n"
    "# This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.\n"
    "# This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.\n"
    "# You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.\n"
)

DATA_ROWS = range(2, 731)  # rows 2..730 inclusive = 729 cells, row-major (validated)


def recover(cv):
    """Return (value 1..64, status) where status is 'ok' | 'recovered' | 'unknown'."""
    if cv == "" or cv is None:
        return 1, "unknown"
    try:
        n = int(float(cv))
        if 1 <= n <= 64:
            return n, "ok"
        return 1, "unknown"
    except (ValueError, TypeError):
        pass
    groups = re.findall(r"\d+", str(cv))
    if len(groups) == 1 and 1 <= int(groups[0]) <= 64:
        return int(groups[0]), "recovered"
    return 1, "unknown"


def chakra_columns(sheet):
    return [c for c in range(2, sheet.ncols) if str(sheet.cell_value(1, c)).strip()]


def ingest(src_dir, out_dir):
    report = []  # (chakra_id, list of (cell_index, raw_token, action))
    counts = {"chakras": 0, "clean": 0, "recovered_cells": 0, "unknown_cells": 0}
    for name, num, sheet_name in ADHYAYAS:
        path = os.path.join(src_dir, f"Chakra_Adhyaya_{name}.xls")
        if not os.path.exists(path):
            print(f"  skip (missing): {path}")
            continue
        wb = xlrd.open_workbook(path)
        sh = wb.sheet_by_name(sheet_name)
        chap_dir = os.path.join(out_dir, "chapters", str(num))
        os.makedirs(chap_dir, exist_ok=True)
        for m, col in enumerate(chakra_columns(sh), start=1):
            cid = str(sh.cell_value(1, col)).strip()
            issues = []
            vals = []
            for k, r in enumerate(DATA_ROWS, start=1):  # k = cell index 1..729
                raw = sh.cell_value(r, col) if r < sh.nrows else ""
                v, status = recover(raw)
                vals.append(v)
                if status != "ok":
                    issues.append((k, repr(raw), status))
            assert len(vals) == 729, f"{cid}: got {len(vals)} cells"
            counts["chakras"] += 1
            rec = sum(1 for _, _, s in issues if s == "recovered")
            unk = sum(1 for _, _, s in issues if s == "unknown")
            counts["recovered_cells"] += rec
            counts["unknown_cells"] += unk
            if not issues:
                counts["clean"] += 1
            # Adhyaya 1 already ships in the repo (cleaned); write only 2..8.
            if num != 1:
                out_path = os.path.join(chap_dir, f"chakra_{m}.txt")
                hdr = GPL_HEADER + (
                    f"# Siri Bhoovalaya Khanda 1, Adhyaya {num}, Chakra {m} (source id {cid}).\n"
                    f"# Grid: Anil Kumar Jain digitization (Chakra_Adhyaya_1to8, 2012), 27x27, values 1-64, row-major.\n"
                    f"# Ingested by tools/ingest_chakra_xls.py. Unknown/ambiguous cells filled with 1; see INGEST_REPORT.md.\n"
                )
                with open(out_path, "w") as f:
                    f.write(hdr + ",".join(map(str, vals)) + "\n")
            report.append((num, m, cid, issues))
    return report, counts


def write_report(out_dir, report, counts):
    lines = ["# Adhyaya 2-8 ingestion report", ""]
    lines.append(
        f"{counts['chakras']} chakras ingested; {counts['clean']} perfectly clean. "
        f"{counts['recovered_cells']} cells recovered from typos, "
        f"{counts['unknown_cells']} cells unknown (filled with 1).\n"
    )
    lines.append("Cells are 1-indexed in row-major order (cell k -> grid[(k-1)//27][(k-1)%27]).\n")
    for num, m, cid, issues in report:
        if not issues:
            continue
        lines.append(f"## Adhyaya {num} Chakra {m} ({cid}) — {len(issues)} cell(s)")
        for k, raw, status in issues:
            lines.append(f"- cell {k}: {raw} -> {status}")
        lines.append("")
    path = os.path.join(out_dir, "chapters", "INGEST_REPORT.md")
    with open(path, "w") as f:
        f.write("\n".join(lines))
    print(f"  report -> {path}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True, help="dir containing Chakra_Adhyaya_*.xls")
    ap.add_argument("--out", required=True, help="decoder/data directory")
    args = ap.parse_args()
    report, counts = ingest(args.src, args.out)
    write_report(args.out, report, counts)
    print(
        f"Done: {counts['chakras']} chakras, {counts['clean']} clean, "
        f"{counts['recovered_cells']} recovered, {counts['unknown_cells']} unknown."
    )


if __name__ == "__main__":
    main()
