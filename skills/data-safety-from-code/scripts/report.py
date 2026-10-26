#!/usr/bin/env python3
"""Write data_safety_report.md: every answer with the evidence behind it.

    python3 report.py findings.json declaration.json [--current current_export.csv] -o data_safety_report.md
"""
from __future__ import annotations

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import csvlib as c  # noqa: E402

PURPOSE_NAMES = {
    "PSL_APP_FUNCTIONALITY": "App functionality",
    "PSL_ANALYTICS": "Analytics",
    "PSL_DEVELOPER_COMMUNICATIONS": "Developer communications",
    "PSL_FRAUD_PREVENTION_SECURITY": "Fraud prevention, security and compliance",
    "PSL_ADVERTISING": "Advertising or marketing",
    "PSL_PERSONALIZATION": "Personalization",
    "PSL_ACCOUNT_MANAGEMENT": "Account management",
}
ACM_NAMES = {
    "PSL_ACM_USER_ID_PASSWORD": "Username and password",
    "PSL_ACM_USER_ID_OTHER_AUTH": "Username and other authentication",
    "PSL_ACM_USER_ID_PASSWORD_OTHER_AUTH": "Username, password and other authentication",
    "PSL_ACM_OAUTH": "OAuth",
    "PSL_ACM_OTHER": "Other",
    "PSL_ACM_NONE": "No account creation",
}


def yn(v) -> str:
    return "Yes" if v is True else ("No" if v is False else "—")


def purposes(ps) -> str:
    return ", ".join(PURPOSE_NAMES.get(p, p) for p in ps) or "—"


def where(e: dict) -> str:
    if e.get("file"):
        return f"`{e['file']}:{e['line']}`" if e.get("line") else f"`{e['file']}`"
    return ""


def build(findings: dict, decl: dict, tpl: c.Template, current: dict | None) -> str:
    L: list[str] = []
    w = L.append
    name = os.path.basename(findings.get("project", "").rstrip("/")) or "app"
    w(f"# Data safety draft — {name}")
    w("")
    w("> **Draft for review.** This was generated from the code by `data-safety-from-code`. You, the developer, are "
      "responsible for what you declare in Play Console. Check every answer below, especially the items under "
      "*Needs your review* and *Could not verify*.")
    w("")
    w(f"Scanned `{findings.get('project')}` on {findings.get('scanned_at')}.")
    w("")

    types = decl.get("data_types") or {}
    w("## Summary")
    w("")
    w(f"- Collects or shares user data: **{yn(decl.get('collects_data'))}**")
    w(f"- Encrypted in transit: **{yn(decl.get('encrypted_in_transit'))}** ({decl.get('_encrypted_source', '')})")
    acm = decl.get("account_creation") or []
    w(f"- Account creation: **{', '.join(ACM_NAMES.get(a, a) for a in acm) or 'unanswered'}**"
      f" ({(decl.get('_sources') or {}).get('account_creation', 'unanswered')})")
    deletion = {"yes": "Yes", "no": "No", "auto_deleted_90_days": "No, deleted automatically within 90 days"}
    w(f"- Users can request deletion: **{deletion.get(decl.get('data_deletion'), 'unanswered')}**")
    if decl.get("privacy_policy_url"):
        w(f"- Privacy policy: {decl['privacy_policy_url']}")
    w("")

    if types:
        w("| Data type | Collected | Shared | Ephemeral | Required / optional | Purposes |")
        w("|---|---|---|---|---|---|")
        for t, d in types.items():
            ps = purposes(d.get("collection_purposes") or [])
            if d.get("shared"):
                ps += f" · shared for: {purposes(d.get('sharing_purposes') or [])}"
            w(f"| {tpl.type_label(t)} | {yn(d.get('collected'))} | {yn(d.get('shared'))} | {yn(d.get('ephemeral'))} "
              f"| {d.get('user_control') or '—'} | {ps} |")
        w("")
        w("## Evidence for each data type")
        w("")
        for t, d in types.items():
            w(f"### {tpl.type_label(t)}")
            w("")
            for e in d.get("evidence") or []:
                bits = [f"**{e.get('detail') or e.get('source')}**"]
                loc = where(e)
                if loc:
                    bits.append(loc)
                flags = []
                if e.get("collected"):
                    flags.append("collected")
                if e.get("shared"):
                    flags.append("shared")
                if flags:
                    bits.append(" + ".join(flags))
                if e.get("purposes"):
                    bits.append(purposes(e["purposes"]))
                if e.get("link"):
                    bits.append(f"[vendor disclosure]({e['link']})")
                w("- " + " — ".join(bits))
                for extra in (e.get("all") or [])[1:]:
                    w(f"  - also `{extra}`")
            w("")
    else:
        w("No data types are declared.")
        w("")

    sdks = findings.get("sdks") or []
    if sdks:
        w("## SDKs found")
        w("")
        w("| SDK | Declared in | Source | Confidence |")
        w("|---|---|---|---|")
        for s in sdks:
            m = s["matched"][0]
            src = f"[link]({s['source']})" if s.get("source") else "—"
            w(f"| {s['name']} | `{m['file']}:{m['line']}` ({m['scope']}) | {src} | {s['confidence']} |")
        w("")

    review = list(decl.get("_review") or [])
    for p in findings.get("permissions") or []:
        if p.get("source") == "app" and p.get("known") and not p.get("used_in_code") and not p.get("removed"):
            review.append(f"`{p['name']}` is declared in `{p['file']}:{p['line']}` but no code uses it. If no library "
                          f"needs it, remove it: unused sensitive permissions are a policy risk on their own.")
        if p.get("source") == "merged" and p.get("types"):
            review.append(f"`{p['name']}` is added by a library (merged manifest). Check which SDK adds it and whether it "
                          f"collects {', '.join(tpl.type_label(t) for t in p['types'])}.")
    for u in findings.get("unknown_dependencies") or []:
        review.append(f"Dependency `{u['coord']}` (`{u['file']}:{u['line']}`) is not in the knowledge base. Check its "
                      f"vendor's Play data disclosure.")
    declared = set(types)
    for s in findings.get("signals") or []:
        missing = [t for t in s.get("types") or [] if t not in declared]
        if s["kind"] in ("network_client", "webview") or missing:
            ev = s["evidence"][0]
            what = f" Not declared: {', '.join(tpl.type_label(t) for t in missing)}." if missing else ""
            w_ = f"{s['description']} — `{ev['file']}:{ev['line']}`"
            if len(s["evidence"]) > 1:
                w_ += f" (+{len(s['evidence']) - 1} more)"
            review.append(w_ + "." + what)
    for h in (findings.get("network") or {}).get("http_urls") or []:
        review.append(f"Plain HTTP URL `{h['url']}` at `{h['file']}:{h['line']}`.")
    if review:
        w("## Needs your review")
        w("")
        for r in review:
            w(f"- {r}")
        w("")

    if decl.get("_unanswered"):
        w("## Unanswered")
        w("")
        for u in decl["_unanswered"]:
            w(f"- {u}")
        w("")

    if current is not None:
        w("## Changes compared to your current form")
        w("")
        cur = current.get("data_types") or {}
        changes = []
        for t in types:
            if t not in cur:
                changes.append(f"**Added** {tpl.type_label(t)}")
        for t in cur:
            if t not in types:
                changes.append(f"**Removed** {tpl.type_label(t)}")
        for t in types:
            if t in cur:
                a, b = cur[t], types[t]
                for k in ("collected", "shared", "ephemeral", "user_control"):
                    if (a.get(k) or None) != (b.get(k) or None):
                        changes.append(f"{tpl.type_label(t)}: {k} {a.get(k)} → {b.get(k)}")
                for k in ("collection_purposes", "sharing_purposes"):
                    if sorted(a.get(k) or []) != sorted(b.get(k) or []):
                        changes.append(f"{tpl.type_label(t)}: {k.replace('_', ' ')} {purposes(a.get(k) or [])} → "
                                       f"{purposes(b.get(k) or [])}")
        for k in ("encrypted_in_transit", "account_creation", "data_deletion"):
            if current.get(k) != decl.get(k) and decl.get(k) is not None:
                changes.append(f"{k.replace('_', ' ')}: {current.get(k)} → {decl.get(k)}")
        for ch in changes or ["No changes."]:
            w(f"- {ch}")
        w("")

    w("## Could not verify from code")
    w("")
    w("- What your **backend** does with the data it receives, and whether it passes data to third parties.")
    w("- Data collected by **older versions** still installed by users: one form covers every version on Play.")
    w("- SDK behavior that depends on console settings (e.g. Analytics data sharing, Google Signals, ad personalization).")
    w("- Data entered in **WebViews** or third-party UIs your app shows.")
    for n in findings.get("notes") or []:
        w(f"- {n}")
    w("")
    w("## Next steps")
    w("")
    w("1. Read this report and fix anything wrong in `answers.json`, then run `draft.py` and `fill_csv.py` again.")
    w("2. In Play Console open **App content → Data safety**, and **Export to CSV** first as a backup: importing "
      "replaces every answer in the form.")
    w("3. **Import to CSV**, choose `data_safety.csv`, check the preview, then save and submit.")
    w("")
    return "\n".join(L)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("findings")
    ap.add_argument("declaration")
    ap.add_argument("--current", help="the developer's current Play Console export, to list changes")
    ap.add_argument("--template", default=c.DEFAULT_TEMPLATE)
    ap.add_argument("-o", "--out", default="data_safety_report.md")
    a = ap.parse_args()
    current = c.declaration_from_rows(c.load_template(a.current)) if a.current else None
    text = build(c.load_json(a.findings), c.load_json(a.declaration), c.load_template(a.template), current)
    with open(a.out, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"wrote {a.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
