#!/usr/bin/env python3
"""Turn scan findings + the developer's answers into a declaration (the filled form as JSON).

    python3 draft.py findings.json [--answers answers.json] [--current current_export.csv] -o declaration.json

- SDK entries from the knowledge base are added automatically, with their evidence.
- SDK entries that only apply under a condition, SDKs that don't ship in release builds and
  entries marked `inferred` go to the review list instead of being silently trusted.
- Source-code signals are never added on their own: the agent decides, then records each
  decision in answers.json under "add" / "remove" with a reason and file:line evidence.
- Questions code can't answer (account creation, deletion, badges) come from answers.json,
  then from --current (the developer's existing Play Console export), else stay unanswered.
"""
from __future__ import annotations

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import csvlib as c  # noqa: E402

TOP_LEVEL = [
    "account_creation", "account_creation_other", "account_deletion_url", "data_deletion", "data_deletion_url",
    "outside_app_accounts", "outside_app_account_types", "outside_app_account_specify",
    "families_policy", "independently_validated", "upi_badge",
]


def _contrib(decl_types: dict, type_id: str, *, collected: bool, shared: bool, ephemeral, optional,
             purposes: list[str], sharing_purposes: list[str] | None, evidence: dict) -> None:
    d = decl_types.setdefault(type_id, {
        "collected": False, "shared": False, "ephemeral": None, "user_control": None,
        "collection_purposes": [], "sharing_purposes": [], "evidence": [], "_optional_votes": [],
    })
    d["collected"] = d["collected"] or collected
    d["shared"] = d["shared"] or shared
    if collected:
        # Ephemeral only if every collecting source says so.
        e = True if ephemeral is True else False
        d["ephemeral"] = e if d["ephemeral"] is None else (d["ephemeral"] and e)
        d["_optional_votes"].append(optional is True)
        for p in purposes:
            if p not in d["collection_purposes"]:
                d["collection_purposes"].append(p)
    if shared:
        for p in (sharing_purposes if sharing_purposes is not None else purposes):
            if p not in d["sharing_purposes"]:
                d["sharing_purposes"].append(p)
    d["evidence"].append(evidence)


def draft(findings: dict, answers: dict, current: dict | None, template: c.Template) -> dict:
    types: dict = {}
    review: list[str] = []
    excluded = answers.get("exclude_sdks") or {}
    include_conditional = set(answers.get("include_conditional") or [])
    purpose_order = template.purposes()
    type_order = template.type_ids()

    for s in findings.get("sdks", []):
        sid = s["id"]
        if sid in excluded:
            review.append(f"{s['name']}: excluded by the developer ({excluded[sid]})")
            continue
        if not s.get("ships_in_release", True):
            review.append(f"{s['name']}: only in test/debug/build configurations, not declared")
            continue
        m = s["matched"][0]
        if s.get("confidence") != "official":
            review.append(f"{s['name']}: knowledge entry is inferred, not from an official vendor page; check it")
        for d in s.get("data", []):
            key = f"{sid}:{d['type']}"
            if d.get("condition") and key not in include_conditional:
                review.append(f"{s['name']} collects {template.type_label(d['type'])} only if: {d['condition']}. "
                              f"If that applies, add \"{key}\" to include_conditional in answers.json")
                continue
            _contrib(types, d["type"], collected=bool(d.get("collected")), shared=bool(d.get("shared")),
                     ephemeral=d.get("ephemeral"), optional=d.get("optional"), purposes=d.get("purposes") or [],
                     sharing_purposes=None,
                     evidence={"source": f"sdk:{sid}", "detail": f"{s['name']} ({m['coord']})", "file": m["file"],
                               "line": m["line"], "link": s.get("source"),
                               "collected": bool(d.get("collected")), "shared": bool(d.get("shared")),
                               "purposes": d.get("purposes") or []})

    for a in answers.get("add") or []:
        ev = a.get("evidence") or []
        first = ev[0] if ev else ""
        file, _, line = (first.rpartition(":") if ":" in str(first) else (first, "", ""))
        _contrib(types, a["type"], collected=bool(a.get("collected", True)), shared=bool(a.get("shared", False)),
                 ephemeral=a.get("ephemeral"), optional=a.get("optional"), purposes=a.get("purposes") or [],
                 sharing_purposes=a.get("sharing_purposes"),
                 evidence={"source": "code" if ev else "answer", "detail": a.get("reason", ""), "file": file or None,
                           "line": int(line) if str(line).isdigit() else None, "all": ev,
                           "collected": bool(a.get("collected", True)), "shared": bool(a.get("shared", False)),
                           "purposes": a.get("purposes") or []})

    for r in answers.get("remove") or []:
        t = r["type"]
        if t in types:
            if r.get("sdk"):
                types[t]["evidence"] = [e for e in types[t]["evidence"] if e["source"] != f"sdk:{r['sdk']}"]
                if not types[t]["evidence"]:
                    del types[t]
            else:
                del types[t]
            review.append(f"{template.type_label(t)} removed by the developer: {r.get('reason', 'no reason given')}")

    # Per-type overrides, user control, and stable ordering.
    control = answers.get("user_control") or {}
    eph_override = answers.get("ephemeral") or {}
    for t, d in types.items():
        votes = d.pop("_optional_votes")
        if t in control:
            d["user_control"] = control[t]
        elif "default" in control:
            d["user_control"] = control["default"]
        elif votes and all(votes):
            d["user_control"] = "optional"
        elif d["collected"]:
            d["user_control"] = "required"
        if t in eph_override:
            d["ephemeral"] = bool(eph_override[t])
        if not d["collected"]:
            d["ephemeral"] = None
            d["user_control"] = None
        d["collection_purposes"].sort(key=lambda p: purpose_order.index(p) if p in purpose_order else 99)
        d["sharing_purposes"].sort(key=lambda p: purpose_order.index(p) if p in purpose_order else 99)
    types = dict(sorted(types.items(), key=lambda kv: type_order.index(kv[0]) if kv[0] in type_order else 999))

    decl: dict = {"collects_data": bool(types)}
    net = findings.get("network", {})
    if "encrypted_in_transit" in answers and answers["encrypted_in_transit"] is not None:
        decl["encrypted_in_transit"] = bool(answers["encrypted_in_transit"])
        decl["_encrypted_source"] = "answer"
    else:
        decl["encrypted_in_transit"] = net.get("encrypted_in_transit_suggestion")
        decl["_encrypted_source"] = f"scan: {net.get('reason', '')}"

    sources: dict = {}
    for k in TOP_LEVEL:
        if k in answers:
            decl[k] = answers[k]
            sources[k] = "answer"
        elif current and current.get(k) not in (None, "", []):
            decl[k] = current[k]
            sources[k] = "current export"
        else:
            decl[k] = None
    decl["_sources"] = sources
    decl["data_types"] = types
    decl["privacy_policy_url"] = answers.get("privacy_policy_url")

    unanswered = []
    if decl["collects_data"] and decl["encrypted_in_transit"] is None:
        unanswered.append(f"encrypted_in_transit: {net.get('reason', 'unknown')}")
    if not decl.get("account_creation"):
        hints = sorted({s["account_method"] for s in findings.get("signals", []) if s.get("account_method")})
        unanswered.append("account_creation: " + (f"code suggests {', '.join(hints)}" if hints
                                                    else f"no sign-in code found; likely [{c.ACM_NONE}]"))
    acm = decl.get("account_creation") or []
    if acm and c.ACM_NONE not in acm and not decl.get("account_deletion_url"):
        unanswered.append("account_deletion_url: required when users can create an account")
    if decl["collects_data"] and not decl.get("data_deletion"):
        unanswered.append("data_deletion: yes / no / auto_deleted_90_days")
    if not decl["privacy_policy_url"]:
        unanswered.append("privacy_policy_url: Play requires one for every app, even one that collects no data "
                          "(entered in Play Console, not in the CSV)")
    decl["_unanswered"] = unanswered
    decl["_review"] = review
    return decl


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("findings")
    ap.add_argument("--answers")
    ap.add_argument("--current", help="the developer's current Play Console export, used for non-code answers")
    ap.add_argument("--template", default=c.DEFAULT_TEMPLATE)
    ap.add_argument("-o", "--out", default="declaration.json")
    a = ap.parse_args()
    findings = c.load_json(a.findings)
    answers = c.load_json(a.answers) if a.answers else {}
    current = c.declaration_from_rows(c.load_template(a.current)) if a.current else None
    decl = draft(findings, answers, current, c.load_template(a.template))
    c.dump_json(decl, a.out)
    print(f"data types: {', '.join(decl['data_types']) or 'none'}")
    for u in decl["_unanswered"]:
        print(f"UNANSWERED {u}")
    for r in decl["_review"]:
        print(f"REVIEW     {r}")
    print(f"\nwrote {a.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
