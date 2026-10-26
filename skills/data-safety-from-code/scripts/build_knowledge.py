#!/usr/bin/env python3
"""Compile knowledge/*.yaml to knowledge/*.json and check every ID against the template.

    python3 build_knowledge.py          # write the .json files
    python3 build_knowledge.py --check  # fail if .json is stale or an ID is unknown (CI)

The YAML files are what contributors edit. The other scripts read only the JSON, so running
the skill needs nothing beyond the Python standard library. This script needs PyYAML.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import csvlib as c  # noqa: E402

FILES = ["sdks", "permissions"]
SDK_KEYS = {"id", "name", "vendor", "category", "match", "source", "verified", "confidence", "notes", "data"}
DATA_KEYS = {"type", "collected", "shared", "ephemeral", "optional", "purposes", "condition", "what"}
CATEGORIES = {"ads", "analytics", "crash", "auth", "database", "messaging", "payments", "ml", "ai", "other"}


def check_sdks(sdks, types, purposes) -> list[str]:
    errs, ids = [], set()
    for s in sdks:
        sid = s.get("id", "?")
        if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", str(sid)):
            errs.append(f"sdks: id {sid!r} must be kebab-case")
        if sid in ids:
            errs.append(f"sdks: duplicate id {sid}")
        ids.add(sid)
        for k in set(s) - SDK_KEYS:
            errs.append(f"sdks/{sid}: unknown key {k}")
        for k in ("name", "match", "source", "confidence", "data"):
            if k not in s:
                errs.append(f"sdks/{sid}: missing {k}")
        if s.get("category") not in CATEGORIES:
            errs.append(f"sdks/{sid}: category must be one of {sorted(CATEGORIES)}")
        if s.get("confidence") not in ("official", "inferred"):
            errs.append(f"sdks/{sid}: confidence must be official or inferred")
        for m in s.get("match") or []:
            if ":" not in m:
                errs.append(f"sdks/{sid}: match {m!r} must be group:artifact")
        for d in s.get("data") or []:
            for k in set(d) - DATA_KEYS:
                errs.append(f"sdks/{sid}: unknown data key {k}")
            if d.get("type") not in types:
                errs.append(f"sdks/{sid}: data type {d.get('type')} is not in the template")
            for p in d.get("purposes") or []:
                if p not in purposes:
                    errs.append(f"sdks/{sid}: purpose {p} is not in the template")
            if not d.get("collected") and not d.get("shared"):
                errs.append(f"sdks/{sid}: {d.get('type')} is neither collected nor shared")
    return errs


def check_permissions(perms, types) -> list[str]:
    errs = []
    for p in perms:
        for t in p.get("types") or []:
            if t not in types:
                errs.append(f"permissions/{p.get('permission')}: type {t} is not in the template")
        for rx in p.get("apis") or []:
            try:
                re.compile(rx)
            except re.error as e:
                errs.append(f"permissions/{p.get('permission')}: bad regex {rx!r}: {e}")
    return errs


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    import yaml  # dev-only dependency

    tpl = c.load_template()
    types, purposes = set(tpl.type_ids()), set(tpl.purposes())
    errs: list[str] = []
    for name in FILES:
        src = os.path.join(c.KNOWLEDGE_DIR, f"{name}.yaml")
        dst = os.path.join(c.KNOWLEDGE_DIR, f"{name}.json")
        with open(src, encoding="utf-8") as f:
            data = yaml.safe_load(f) or []
        # YAML turns 2026-10-26 into a date; keep it a string in JSON.
        text = json.dumps(data, indent=2, ensure_ascii=False, default=str) + "\n"
        errs += check_sdks(data, types, purposes) if name == "sdks" else check_permissions(data, types)
        if a.check:
            current = open(dst, encoding="utf-8").read() if os.path.exists(dst) else ""
            if current != text:
                errs.append(f"{name}.json is stale: run scripts/build_knowledge.py")
        else:
            with open(dst, "w", encoding="utf-8") as f:
                f.write(text)
            print(f"wrote knowledge/{name}.json ({len(data)} entries)")
    for e in errs:
        print(f"ERROR {e}")
    return 1 if errs else 0


if __name__ == "__main__":
    sys.exit(main())
