#!/usr/bin/env python3
"""Write data_safety.csv from a declaration, using Google's template row for row.

    python3 fill_csv.py declaration.json [--template current_export.csv] -o data_safety.csv

Only the Response value column is written. Every row of the template is kept, in order, with
its original bytes; values the declaration doesn't set are left blank. The result is validated
right away (see validate.py).
"""
from __future__ import annotations

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import csvlib as c  # noqa: E402
from validate import validate  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("declaration")
    ap.add_argument("--template", default=c.DEFAULT_TEMPLATE,
                    help="the developer's own Play Console export (preferred) or the bundled template")
    ap.add_argument("-o", "--out", default="data_safety.csv")
    a = ap.parse_args()

    tpl = c.load_template(a.template)
    decl = c.load_json(a.declaration)
    try:
        values = c.declaration_to_values(tpl, decl)
    except c.TemplateError as e:
        print(f"ERROR {e}. The template may be older or newer than this skill; export a fresh CSV from Play Console.")
        return 1
    c.write_csv(tpl, values, a.out)
    print(f"wrote {a.out} ({len(tpl.rows)} rows, {sum(1 for v in values.values() if v)} answered)")

    errors, warnings = validate(a.out, a.template)
    for e in errors:
        print(f"ERROR   {e}")
    for w in warnings:
        print(f"WARNING {w}")
    print(f"{len(errors)} error(s), {len(warnings)} warning(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
