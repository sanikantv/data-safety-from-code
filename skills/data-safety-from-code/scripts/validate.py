#!/usr/bin/env python3
"""Check a Data safety CSV before importing it in Play Console.

    python3 validate.py data_safety.csv [--template data_safety_template.csv] [--json]

Errors (exit code 1) are things Play Console would reject or that make the form wrong:
rows that differ from the template, bad values, unanswered required questions, a data type
selected without its usage answers, usage answers on a type that isn't selected.
Warnings are things to check by hand (e.g. an optional question left blank).
"""
from __future__ import annotations

import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import csvlib as c  # noqa: E402


def validate(filled_path: str, template_path: str = c.DEFAULT_TEMPLATE) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    try:
        tpl = c.load_template(template_path)
        f = c.load_template(filled_path)
    except c.TemplateError as e:
        return [str(e)], []

    # 1. Same rows, same order, same requirement column.
    if [r.key for r in f.rows] != [r.key for r in tpl.rows]:
        tk, fk = [r.key for r in tpl.rows], [r.key for r in f.rows]
        missing = [k for k in tk if k not in set(fk)]
        extra = [k for k in fk if k not in set(tk)]
        for k in missing[:10]:
            errors.append(f"missing row {k[0]},{k[1]}")
        for k in extra[:10]:
            errors.append(f"row not in template: {k[0]},{k[1]}")
        if not missing and not extra:
            errors.append("rows are reordered compared to the template")
        return errors, warnings
    for a, b in zip(tpl.rows, f.rows):
        if a.requirement != b.requirement:
            errors.append(f"line {b.index + 1}: answer requirement changed ({a.requirement} -> {b.requirement})")

    T = {"true"}
    vals = {r.key: r.value for r in f.rows}
    line = {r.key: r.index + 1 for r in f.rows}

    def is_true(key):
        return vals.get(key, "").strip().lower() in T

    def answered(qid):
        return vals.get((qid, ""), "").strip() != ""

    def chosen(qid):
        return [r.rid for r in f.rows if r.qid == qid and is_true(r.key)]

    # 2. Values.
    for r in f.rows:
        v = r.value.strip()
        if v == "":
            continue
        if r.qid in c.TEXT_QUESTIONS:
            continue
        if v.lower() not in ("true", "false"):
            errors.append(f"line {r.index + 1}: value must be true, false or blank, got {r.value!r} ({r.qid},{r.rid})")
        elif r.requirement in ("MULTIPLE_CHOICE", "SINGLE_CHOICE") and v.lower() == "false":
            warnings.append(f"line {r.index + 1}: unchecked choices are usually left blank, not false ({r.qid},{r.rid})")

    # 3. REQUIRED rows.
    for r in f.rows:
        if r.requirement == "REQUIRED" and r.value.strip() == "":
            errors.append(f"line {r.index + 1}: required question is blank: {r.label}")

    collects = is_true((c.Q_COLLECTS, ""))
    type_rows = tpl.data_types()
    selected = [t for cat, t, _ in type_rows if is_true((cat, t))]

    # 4. Top-level consistency.
    if collects and not selected:
        errors.append(f"line {line[(c.Q_COLLECTS, '')]}: says the app collects data but no data type is selected")
    if not collects and selected:
        errors.append(f"line {line[(c.Q_COLLECTS, '')]}: says no data is collected but {len(selected)} data type(s) are selected")
    if collects and not answered(c.Q_ENCRYPTED):
        errors.append(f"line {line[(c.Q_ENCRYPTED, '')]}: answer whether all collected data is encrypted in transit")

    methods = chosen(c.Q_ACCOUNT_METHODS)
    if collects and not methods:
        errors.append("account creation: select at least one method (or 'My app does not allow users to create an account')")
    if c.ACM_NONE in methods and len(methods) > 1:
        errors.append("account creation: 'does not allow users to create an account' is selected together with other methods")
    if c.ACM_OTHER in methods and not answered(c.Q_ACM_SPECIFY):
        errors.append(f"line {line[(c.Q_ACM_SPECIFY, '')]}: describe the 'Other' account creation method")
    if methods and c.ACM_NONE not in methods and not answered(c.Q_ACCOUNT_DELETION_URL):
        errors.append(f"line {line[(c.Q_ACCOUNT_DELETION_URL, '')]}: apps that let users create an account must give an account deletion URL")

    deletion = chosen(c.Q_DATA_DELETION)
    if len(deletion) > 1:
        errors.append("data deletion: pick only one answer")
    if collects and not deletion:
        warnings.append("data deletion: 'Do you provide a way for users to request that their data is deleted?' is blank")

    if is_true((c.Q_OUTSIDE_ACCOUNTS, "")):
        outside = chosen(c.Q_OUTSIDE_ACCOUNT_TYPES)
        if not outside:
            errors.append("outside-app accounts: say how these accounts are created")
        if c.OUTSIDE_OTHER in outside and not answered(c.Q_OUTSIDE_ACCOUNT_SPECIFY):
            errors.append(f"line {line[(c.Q_OUTSIDE_ACCOUNT_SPECIFY, '')]}: describe how the 'Other' outside accounts are created")
    elif chosen(c.Q_OUTSIDE_ACCOUNT_TYPES):
        errors.append("outside-app account types are selected but 'Can users login with accounts created outside of the app?' is not true")

    # 5. Generic SINGLE_CHOICE check: never more than one true per question.
    groups: dict[str, list[str]] = {}
    for r in f.rows:
        if r.requirement == "SINGLE_CHOICE" and is_true(r.key):
            groups.setdefault(r.qid, []).append(r.rid)
    for qid, rids in groups.items():
        if len(rids) > 1:
            errors.append(f"{qid}: single-choice question has {len(rids)} answers: {', '.join(rids)}")

    # 6. Per data type usage answers.
    for _, t, label in type_rows:
        usage_rows = [r for r in f.rows if r.qid.startswith(f"{c.USAGE_PREFIX}:{t}:")]
        name = label or t
        if t not in selected:
            filled = [r for r in usage_rows if r.value.strip() != ""]
            if filled:
                errors.append(f"line {filled[0].index + 1}: {name} is not selected but has {len(filled)} usage answer(s)")
            continue
        cs = chosen(c.usage_qid(t, c.USAGE_COLLECTION_AND_SHARING))
        collected, shared = c.R_COLLECTED in cs, c.R_SHARED in cs
        if not cs:
            errors.append(f"{name}: say whether this data is collected, shared, or both")
            continue
        if collected:
            if not answered(c.usage_qid(t, c.USAGE_EPHEMERAL)):
                errors.append(f"{name}: answer whether this data is processed ephemerally")
            control = chosen(c.usage_qid(t, c.USAGE_USER_CONTROL))
            if len(control) != 1:
                errors.append(f"{name}: say whether collection is required or optional (exactly one)")
            if not chosen(c.usage_qid(t, c.USAGE_COLLECTION_PURPOSE)):
                errors.append(f"{name}: select at least one purpose for collecting this data")
        else:
            if chosen(c.usage_qid(t, c.USAGE_COLLECTION_PURPOSE)):
                errors.append(f"{name}: collection purposes are set but the data is not marked collected")
        if shared and not chosen(c.usage_qid(t, c.USAGE_SHARING_PURPOSE)):
            errors.append(f"{name}: select at least one purpose for sharing this data")
        if not shared and chosen(c.usage_qid(t, c.USAGE_SHARING_PURPOSE)):
            errors.append(f"{name}: sharing purposes are set but the data is not marked shared")

    # 7. Rows this skill doesn't know about (Google added a question): fine, but say so.
    known_usage = c.KNOWN_USAGE
    for r in f.rows:
        if r.qid.startswith(c.DATA_TYPES_PREFIX):
            continue
        if r.qid.startswith(c.USAGE_PREFIX + ":"):
            if r.qid.split(":")[-1] not in known_usage:
                warnings.append(f"line {r.index + 1}: unknown usage question {r.qid}; check it in Play Console")
            continue
        if r.qid not in c.KNOWN_TOP and r.requirement in ("REQUIRED", "MAYBE_REQUIRED"):
            warnings.append(f"line {r.index + 1}: question not known to this skill, check it by hand: {r.label}")

    return errors, warnings


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("csv")
    ap.add_argument("--template", default=c.DEFAULT_TEMPLATE)
    ap.add_argument("--json", action="store_true", help="print {errors, warnings} as JSON")
    a = ap.parse_args()
    errors, warnings = validate(a.csv, a.template)
    if a.json:
        print(json.dumps({"errors": errors, "warnings": warnings}, indent=2))
    else:
        for e in errors:
            print(f"ERROR   {e}")
        for w in warnings:
            print(f"WARNING {w}")
        print(f"\n{len(errors)} error(s), {len(warnings)} warning(s)" + ("" if errors else " — ready to import after review"))
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
