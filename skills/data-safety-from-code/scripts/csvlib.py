"""Shared helpers for Google Play's Data safety CSV.

The CSV has one row per possible answer:
    Question ID, Response ID, Response value, Answer requirement, Human-friendly question label

Rules this module enforces:
- Rows are never added, removed or reordered. Only the Response value column changes.
- Every other byte of the template is kept as is (line endings, quoting, labels).
- Booleans are written in the template's own case (Play Console exports lowercase).

A "declaration" is the plain-JSON form of a filled form. fill_csv.py turns a declaration into
CSV rows; declaration_from_rows() turns a filled CSV back into a declaration (used for diffs
against the user's current export and for round-trip tests).
"""
from __future__ import annotations

import io
import csv
import json
import os
from dataclasses import dataclass, field

HEADER = [
    "Question ID (machine readable)",
    "Response ID (machine readable)",
    "Response value",
    "Answer requirement",
    "Human-friendly question label",
]

SKILL_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_TEMPLATE = os.path.join(SKILL_DIR, "template", "data_safety_template.csv")
KNOWLEDGE_DIR = os.path.join(SKILL_DIR, "knowledge")

# Top-level question IDs.
Q_COLLECTS = "PSL_DATA_COLLECTION_COLLECTS_PERSONAL_DATA"
Q_ENCRYPTED = "PSL_DATA_COLLECTION_ENCRYPTED_IN_TRANSIT"
Q_ACCOUNT_METHODS = "PSL_SUPPORTED_ACCOUNT_CREATION_METHODS"
Q_ACM_SPECIFY = "PSL_ACM_SPECIFY"
Q_ACCOUNT_DELETION_URL = "PSL_ACCOUNT_DELETION_URL"
Q_DATA_DELETION = "PSL_SUPPORT_DATA_DELETION_BY_USER"
Q_DATA_DELETION_URL = "PSL_DATA_DELETION_URL"
Q_FAMILY_POLICY = "PSL_DATA_COLLECTION_COMPLIES_FAMILY_POLICY"
Q_INDEPENDENTLY_VALIDATED = "PSL_INDEPENDENTLY_VALIDATED"
Q_UPI_BADGE = "PSL_UPI_BADGE_OPT_IN"
Q_OUTSIDE_ACCOUNTS = "PSL_HAS_OUTSIDE_APP_ACCOUNTS"
Q_OUTSIDE_ACCOUNT_TYPES = "PSL_OUTSIDE_APP_ACCOUNT_TYPES"
Q_OUTSIDE_ACCOUNT_SPECIFY = "PSL_OUTSIDE_APP_ACCOUNT_TYPE_SPECIFY"

ACM_NONE = "PSL_ACM_NONE"
ACM_OTHER = "PSL_ACM_OTHER"
OUTSIDE_OTHER = "PSL_OUTSIDE_APP_ACCOUNT_TYPE_OTHER"

TEXT_QUESTIONS = {Q_ACM_SPECIFY, Q_ACCOUNT_DELETION_URL, Q_DATA_DELETION_URL, Q_OUTSIDE_ACCOUNT_SPECIFY}
BOOL_QUESTIONS = {Q_COLLECTS, Q_ENCRYPTED, Q_FAMILY_POLICY, Q_INDEPENDENTLY_VALIDATED, Q_UPI_BADGE, Q_OUTSIDE_ACCOUNTS}

DATA_TYPES_PREFIX = "PSL_DATA_TYPES_"
USAGE_PREFIX = "PSL_DATA_USAGE_RESPONSES"

# Per-data-type usage questions: PSL_DATA_USAGE_RESPONSES:<TYPE>:<USAGE_*>
USAGE_COLLECTION_AND_SHARING = "PSL_DATA_USAGE_COLLECTION_AND_SHARING"
USAGE_EPHEMERAL = "PSL_DATA_USAGE_EPHEMERAL"
USAGE_USER_CONTROL = "DATA_USAGE_USER_CONTROL"
USAGE_COLLECTION_PURPOSE = "DATA_USAGE_COLLECTION_PURPOSE"
USAGE_SHARING_PURPOSE = "DATA_USAGE_SHARING_PURPOSE"

R_COLLECTED = "PSL_DATA_USAGE_ONLY_COLLECTED"
R_SHARED = "PSL_DATA_USAGE_ONLY_SHARED"
R_OPTIONAL = "PSL_DATA_USAGE_USER_CONTROL_OPTIONAL"
R_REQUIRED = "PSL_DATA_USAGE_USER_CONTROL_REQUIRED"

DELETION_CHOICES = {
    "yes": "DATA_DELETION_YES",
    "no": "DATA_DELETION_NO",
    "auto_deleted_90_days": "DATA_DELETION_NO_AUTO_DELETED",
}


class TemplateError(Exception):
    pass


@dataclass
class Row:
    index: int  # 1-based data row number (header is row 0); CSV line = index + 1
    qid: str
    rid: str
    value: str
    requirement: str
    label: str
    raw_tail: str  # everything after the 3rd comma, written back untouched

    @property
    def key(self) -> tuple[str, str]:
        return (self.qid, self.rid)


@dataclass
class Template:
    path: str
    header_line: str
    rows: list[Row]
    newline: str = "\r\n"
    bom: bool = False
    final_newline: bool = False
    true_word: str = "true"
    false_word: str = "false"
    by_key: dict = field(default_factory=dict)

    def data_types(self) -> list[tuple[str, str, str]]:
        """(category question ID, type ID, label) in template order."""
        return [(r.qid, r.rid, r.label) for r in self.rows if r.qid.startswith(DATA_TYPES_PREFIX)]

    def type_ids(self) -> list[str]:
        return [t for _, t, _ in self.data_types()]

    def purposes(self) -> list[str]:
        """Purpose response IDs, read from the first data type's collection-purpose rows."""
        seen = []
        for r in self.rows:
            parts = r.qid.split(":")
            if len(parts) == 3 and parts[2] == USAGE_COLLECTION_PURPOSE and r.rid not in seen:
                seen.append(r.rid)
        return seen

    def responses(self, qid: str) -> list[str]:
        return [r.rid for r in self.rows if r.qid == qid]

    def type_label(self, type_id: str) -> str:
        for _, t, label in self.data_types():
            if t == type_id:
                return label
        return type_id


def _split_line(line: str) -> tuple[str, str, str, str]:
    """Split a template line into qid, rid, value, tail (requirement + label, raw).

    The first two fields never contain commas or quotes in Google's template, so splitting on the
    first commas is exact. The value field can be quoted when it holds a URL or free text.
    """
    qid, rid, rest = line.split(",", 2)
    if rest.startswith('"'):
        # Quoted value: find the closing quote (doubled quotes are escapes).
        i = 1
        while True:
            j = rest.index('"', i)
            if j + 1 < len(rest) and rest[j + 1] == '"':
                i = j + 2
                continue
            value = rest[1:j].replace('""', '"')
            tail = rest[j + 2 :]  # skip the closing quote and the comma
            break
    else:
        value, tail = rest.split(",", 1)
    return qid, rid, value, tail


def load_template(path: str = DEFAULT_TEMPLATE) -> Template:
    with open(path, "rb") as f:
        data = f.read()
    bom = data.startswith(b"\xef\xbb\xbf")
    text = data.decode("utf-8-sig")
    newline = "\r\n" if "\r\n" in text else "\n"
    final_newline = text.endswith(newline)
    lines = text.split(newline)
    if final_newline:
        lines = lines[:-1]
    header_line = lines[0]
    header = next(csv.reader([header_line]))
    if [h.strip() for h in header] != HEADER:
        raise TemplateError(f"{path}: header does not match Google's Data safety CSV header: {header}")

    rows: list[Row] = []
    true_word, false_word = "true", "false"
    for i, line in enumerate(lines[1:], start=1):
        if not line:
            continue
        try:
            qid, rid, value, tail = _split_line(line)
        except ValueError as e:
            raise TemplateError(f"{path}: cannot parse line {i + 1}: {line[:80]}") from e
        requirement, label = next(csv.reader([tail]))[:2] if tail else ("", "")
        if value.lower() == "true":
            true_word = value
        elif value.lower() == "false":
            false_word = value
        rows.append(Row(i, qid, rid, value, requirement, label, tail))

    t = Template(path, header_line, rows, newline, bom, final_newline, true_word, false_word)
    for r in rows:
        if r.key in t.by_key:
            raise TemplateError(f"{path}: duplicate row {r.qid},{r.rid} at line {r.index + 1}")
        t.by_key[r.key] = r
    if not any(r.qid == Q_COLLECTS for r in rows):
        raise TemplateError(f"{path}: missing {Q_COLLECTS}; this is not a Data safety CSV")
    return t


def _quote(value: str) -> str:
    if any(c in value for c in ',"\r\n'):
        return '"' + value.replace('"', '""') + '"'
    return value


def write_csv(template: Template, values: dict[tuple[str, str], str], path: str) -> None:
    """Write the template with column 3 replaced from `values` (missing keys = blank)."""
    out = [template.header_line]
    for r in template.rows:
        v = values.get(r.key, "")
        out.append(f"{r.qid},{r.rid},{_quote(v)},{r.raw_tail}")
    text = template.newline.join(out)
    if template.final_newline:
        text += template.newline
    data = text.encode("utf-8")
    if template.bom:
        data = b"\xef\xbb\xbf" + data
    with open(path, "wb") as f:
        f.write(data)


def usage_qid(type_id: str, question: str) -> str:
    return f"{USAGE_PREFIX}:{type_id}:{question}"


def _b(v) -> bool | None:
    if v is None:
        return None
    if isinstance(v, bool):
        return v
    s = str(v).strip().lower()
    if s == "true":
        return True
    if s == "false":
        return False
    return None


def declaration_to_values(template: Template, decl: dict) -> dict[tuple[str, str], str]:
    """Map a declaration onto template rows. Raises TemplateError for IDs the template lacks."""
    T, F = template.true_word, template.false_word
    values: dict[tuple[str, str], str] = {}

    def put(qid: str, rid: str, value: str) -> None:
        if (qid, rid) not in template.by_key:
            raise TemplateError(f"row {qid},{rid} is not in the template")
        values[(qid, rid)] = value

    def put_bool(qid: str, v) -> None:
        b = _b(v)
        if b is not None:
            put(qid, "", T if b else F)

    def put_text(qid: str, v) -> None:
        if v:
            put(qid, "", str(v))

    types = decl.get("data_types") or {}
    collects = decl.get("collects_data")
    if collects is None:
        collects = bool(types)
    put_bool(Q_COLLECTS, collects)
    if collects:
        put_bool(Q_ENCRYPTED, decl.get("encrypted_in_transit"))

    for rid in decl.get("account_creation") or []:
        put(Q_ACCOUNT_METHODS, rid, T)
    put_text(Q_ACM_SPECIFY, decl.get("account_creation_other"))
    put_text(Q_ACCOUNT_DELETION_URL, decl.get("account_deletion_url"))

    deletion = decl.get("data_deletion")
    if deletion:
        put(Q_DATA_DELETION, DELETION_CHOICES.get(deletion, deletion), T)
    put_text(Q_DATA_DELETION_URL, decl.get("data_deletion_url"))

    put_bool(Q_FAMILY_POLICY, decl.get("families_policy"))
    put_bool(Q_INDEPENDENTLY_VALIDATED, decl.get("independently_validated"))
    put_bool(Q_UPI_BADGE, decl.get("upi_badge"))
    put_bool(Q_OUTSIDE_ACCOUNTS, decl.get("outside_app_accounts"))
    for rid in decl.get("outside_app_account_types") or []:
        put(Q_OUTSIDE_ACCOUNT_TYPES, rid, T)
    put_text(Q_OUTSIDE_ACCOUNT_SPECIFY, decl.get("outside_app_account_specify"))

    category_of = {t: q for q, t, _ in template.data_types()}
    for type_id, d in types.items():
        if type_id not in category_of:
            raise TemplateError(f"data type {type_id} is not in the template")
        put(category_of[type_id], type_id, T)
        collected, shared = bool(d.get("collected")), bool(d.get("shared"))
        if collected:
            put(usage_qid(type_id, USAGE_COLLECTION_AND_SHARING), R_COLLECTED, T)
        if shared:
            put(usage_qid(type_id, USAGE_COLLECTION_AND_SHARING), R_SHARED, T)
        if collected:
            eph = _b(d.get("ephemeral"))
            put(usage_qid(type_id, USAGE_EPHEMERAL), "", T if eph else F)
            control = d.get("user_control") or "required"
            put(usage_qid(type_id, USAGE_USER_CONTROL), R_OPTIONAL if control == "optional" else R_REQUIRED, T)
            for p in d.get("collection_purposes") or []:
                put(usage_qid(type_id, USAGE_COLLECTION_PURPOSE), p, T)
        if shared:
            for p in d.get("sharing_purposes") or []:
                put(usage_qid(type_id, USAGE_SHARING_PURPOSE), p, T)

    # Escape hatch for questions Google adds after this skill was written: {"QID|RID": "value"}.
    for k, v in (decl.get("raw") or {}).items():
        qid, _, rid = k.partition("|")
        put(qid, rid, str(v))
    return values


KNOWN_TOP = {
    Q_COLLECTS, Q_ENCRYPTED, Q_ACCOUNT_METHODS, Q_ACM_SPECIFY, Q_ACCOUNT_DELETION_URL, Q_DATA_DELETION,
    Q_DATA_DELETION_URL, Q_FAMILY_POLICY, Q_INDEPENDENTLY_VALIDATED, Q_UPI_BADGE, Q_OUTSIDE_ACCOUNTS,
    Q_OUTSIDE_ACCOUNT_TYPES, Q_OUTSIDE_ACCOUNT_SPECIFY,
}
KNOWN_USAGE = {USAGE_COLLECTION_AND_SHARING, USAGE_EPHEMERAL, USAGE_USER_CONTROL, USAGE_COLLECTION_PURPOSE, USAGE_SHARING_PURPOSE}


def declaration_from_rows(template: Template) -> dict:
    """Read a filled CSV (loaded with load_template) back into a declaration."""
    vals = {r.key: r.value for r in template.rows if r.value != ""}

    def b(qid):
        return _b(vals.get((qid, "")))

    def chosen(qid):
        return [rid for (q, rid), v in vals.items() if q == qid and _b(v)]

    decl: dict = {
        "collects_data": b(Q_COLLECTS),
        "encrypted_in_transit": b(Q_ENCRYPTED),
        "account_creation": chosen(Q_ACCOUNT_METHODS),
        "account_creation_other": vals.get((Q_ACM_SPECIFY, ""), ""),
        "account_deletion_url": vals.get((Q_ACCOUNT_DELETION_URL, ""), ""),
        "data_deletion": None,
        "data_deletion_url": vals.get((Q_DATA_DELETION_URL, ""), ""),
        "families_policy": b(Q_FAMILY_POLICY),
        "independently_validated": b(Q_INDEPENDENTLY_VALIDATED),
        "upi_badge": b(Q_UPI_BADGE),
        "outside_app_accounts": b(Q_OUTSIDE_ACCOUNTS),
        "outside_app_account_types": chosen(Q_OUTSIDE_ACCOUNT_TYPES),
        "outside_app_account_specify": vals.get((Q_OUTSIDE_ACCOUNT_SPECIFY, ""), ""),
        "data_types": {},
        "raw": {},
    }
    deletion = chosen(Q_DATA_DELETION)
    if deletion:
        reverse = {v: k for k, v in DELETION_CHOICES.items()}
        decl["data_deletion"] = reverse.get(deletion[0], deletion[0])

    for cat, type_id, _ in template.data_types():
        if not _b(vals.get((cat, type_id))):
            continue
        cs = chosen(usage_qid(type_id, USAGE_COLLECTION_AND_SHARING))
        control = chosen(usage_qid(type_id, USAGE_USER_CONTROL))
        decl["data_types"][type_id] = {
            "collected": R_COLLECTED in cs,
            "shared": R_SHARED in cs,
            "ephemeral": _b(vals.get((usage_qid(type_id, USAGE_EPHEMERAL), ""))),
            "user_control": "optional" if R_OPTIONAL in control else ("required" if R_REQUIRED in control else None),
            "collection_purposes": chosen(usage_qid(type_id, USAGE_COLLECTION_PURPOSE)),
            "sharing_purposes": chosen(usage_qid(type_id, USAGE_SHARING_PURPOSE)),
        }

    # Anything this module doesn't model is kept verbatim so a round trip loses nothing.
    for (qid, rid), v in vals.items():
        if qid.startswith(DATA_TYPES_PREFIX):
            continue
        if qid.startswith(USAGE_PREFIX + ":") and qid.split(":")[-1] in KNOWN_USAGE:
            continue
        if qid in KNOWN_TOP:
            continue
        decl["raw"][f"{qid}|{rid}"] = v
    return decl


def load_json(path: str):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def dump_json(obj, path: str) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.write("\n")


def load_knowledge(name: str):
    return load_json(os.path.join(KNOWLEDGE_DIR, name))
