"""End-to-end and unit tests. Run from the repo root:

    python3 -m unittest discover tests

Set UPDATE_GOLDEN=1 to rewrite tests/expected/<fixture>.csv after an intended change; review the
diff before committing it.
"""
from __future__ import annotations

import filecmp
import os
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS = os.path.join(ROOT, "skills", "data-safety-from-code", "scripts")
FIXTURES = os.path.join(ROOT, "tests", "fixtures")
EXPECTED = os.path.join(ROOT, "tests", "expected")
REFERENCE = os.path.join(EXPECTED, "reference-export.csv")
sys.path.insert(0, SCRIPTS)

import csvlib as c  # noqa: E402
from validate import validate  # noqa: E402


def run(script: str, *args: str) -> subprocess.CompletedProcess:
    return subprocess.run([sys.executable, os.path.join(SCRIPTS, script), *args], capture_output=True, text=True)


class Pipeline(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def pipeline(self, fixture: str) -> tuple[str, dict, dict]:
        project = os.path.join(FIXTURES, fixture)
        findings = os.path.join(self.tmp, "findings.json")
        decl = os.path.join(self.tmp, "declaration.json")
        out = os.path.join(self.tmp, "data_safety.csv")
        for script, args in [
            ("scan.py", [project, "-o", findings]),
            ("draft.py", [findings, "--answers", os.path.join(project, "answers.json"), "-o", decl]),
            ("fill_csv.py", [decl, "-o", out]),
            ("report.py", [findings, decl, "-o", os.path.join(self.tmp, "report.md")]),
        ]:
            p = run(script, *args)
            self.assertEqual(p.returncode, 0, f"{script} failed:\n{p.stdout}\n{p.stderr}")
        return out, c.load_json(findings), c.load_json(decl)

    def check_golden(self, fixture: str, out: str):
        golden = os.path.join(EXPECTED, f"{fixture}.csv")
        if os.environ.get("UPDATE_GOLDEN"):
            shutil.copy(out, golden)
        self.assertTrue(filecmp.cmp(out, golden, shallow=False), f"{fixture}: output differs from {golden}")

    def test_admob_only(self):
        out, f, d = self.pipeline("admob-only")
        self.assertEqual([s["id"] for s in f["sdks"]], ["admob"])
        self.assertEqual(set(d["data_types"]), {"PSL_APPROX_LOCATION", "PSL_PERFORMANCE_DIAGNOSTICS",
                                                "PSL_USER_INTERACTION", "PSL_DEVICE_ID"})
        self.assertTrue(all(t["shared"] for t in d["data_types"].values()))
        self.assertIs(d["encrypted_in_transit"], True)
        self.check_golden("admob-only", out)

    def test_firebase_revenuecat(self):
        out, f, d = self.pipeline("firebase-revenuecat")
        ids = {s["id"] for s in f["sdks"]}
        self.assertTrue({"firebase-analytics", "firebase-crashlytics", "firebase-auth", "firebase-firestore",
                         "revenuecat", "google-sign-in"} <= ids)
        self.assertNotIn("leakcanary", str(f["unknown_dependencies"]))  # debug-only
        kinds = {s["kind"] for s in f["signals"]}
        self.assertTrue({"auth_oauth", "backend_write", "analytics_event"} <= kinds)
        self.assertIn("PSL_USER_GENERATED_CONTENT", d["data_types"])
        self.assertIn("PSL_EMAIL", d["data_types"])  # included conditional: Google sign-in through Firebase Auth
        self.assertNotIn("PSL_PHONE", d["data_types"])  # conditional, not included
        self.check_golden("firebase-revenuecat", out)

    def test_no_data(self):
        out, f, d = self.pipeline("no-data")
        self.assertEqual(f["sdks"], [])
        self.assertFalse(d["collects_data"])
        self.assertEqual(d["_unanswered"], [])
        self.check_golden("no-data", out)

    def test_cleartext_http(self):
        out, f, d = self.pipeline("cleartext-http")
        self.assertIs(f["network"]["encrypted_in_transit_suggestion"], False)
        self.assertIs(d["encrypted_in_transit"], False)
        camera = next(p for p in f["permissions"] if p["name"] == "android.permission.CAMERA")
        self.assertFalse(camera["used_in_code"])
        coarse = next(p for p in f["permissions"] if p["name"] == "android.permission.ACCESS_COARSE_LOCATION")
        self.assertTrue(coarse["used_in_code"])
        self.assertTrue(d["data_types"]["PSL_APPROX_LOCATION"]["ephemeral"])
        self.check_golden("cleartext-http", out)


class Csv(unittest.TestCase):
    def test_template_is_blank_copy_of_reference(self):
        tpl, ref = c.load_template(), c.load_template(REFERENCE)
        self.assertEqual([r.key for r in tpl.rows], [r.key for r in ref.rows])
        self.assertTrue(all(r.value == "" for r in tpl.rows))
        self.assertEqual(len(tpl.type_ids()), 38)
        self.assertEqual(len(tpl.purposes()), 7)

    def test_reference_round_trip_is_byte_identical(self):
        tpl = c.load_template()
        decl = c.declaration_from_rows(c.load_template(REFERENCE))
        with tempfile.TemporaryDirectory() as tmp:
            out = os.path.join(tmp, "rt.csv")
            c.write_csv(tpl, c.declaration_to_values(tpl, decl), out)
            self.assertTrue(filecmp.cmp(out, REFERENCE, shallow=False))

    def test_reference_validates(self):
        errors, _ = validate(REFERENCE)
        self.assertEqual(errors, [])

    def test_text_value_with_comma_is_quoted(self):
        tpl = c.load_template()
        decl = {"collects_data": False, "account_creation": ["PSL_ACM_OTHER"],
                "account_creation_other": 'Invite code, then "magic" link', "account_deletion_url": "https://x.test/d"}
        with tempfile.TemporaryDirectory() as tmp:
            out = os.path.join(tmp, "q.csv")
            c.write_csv(tpl, c.declaration_to_values(tpl, decl), out)
            back = c.declaration_from_rows(c.load_template(out))
            self.assertEqual(back["account_creation_other"], 'Invite code, then "magic" link')

    def test_unknown_type_is_rejected(self):
        with self.assertRaises(c.TemplateError):
            c.declaration_to_values(c.load_template(), {"data_types": {"PSL_TELEPATHY": {"collected": True}}})


class Validator(unittest.TestCase):
    """Each case breaks the reference export in one way and expects an error."""

    def broken(self, mutate) -> list[str]:
        ref = c.load_template(REFERENCE)
        values = {r.key: r.value for r in ref.rows}
        mutate(values)
        with tempfile.TemporaryDirectory() as tmp:
            out = os.path.join(tmp, "b.csv")
            c.write_csv(ref, values, out)
            errors, _ = validate(out)
        return errors

    def test_required_blank(self):
        self.assertTrue(self.broken(lambda v: v.update({(c.Q_COLLECTS, ""): ""})))

    def test_two_single_choices(self):
        def m(v):
            v[(c.usage_qid("PSL_DEVICE_ID", c.USAGE_USER_CONTROL), c.R_REQUIRED)] = "true"
        self.assertTrue(any("exactly one" in e or "single-choice" in e for e in self.broken(m)))

    def test_missing_purpose(self):
        def m(v):
            v[(c.usage_qid("PSL_DEVICE_ID", c.USAGE_COLLECTION_PURPOSE), "PSL_ADVERTISING")] = ""
        self.assertTrue(any("purpose" in e for e in self.broken(m)))

    def test_usage_on_unselected_type(self):
        def m(v):
            v[(c.usage_qid("PSL_NAME", c.USAGE_COLLECTION_PURPOSE), "PSL_ANALYTICS")] = "true"
        self.assertTrue(any("not selected" in e for e in self.broken(m)))

    def test_bad_value(self):
        self.assertTrue(self.broken(lambda v: v.update({(c.Q_ENCRYPTED, ""): "yes"})))

    def test_none_with_other_account_method(self):
        self.assertTrue(self.broken(lambda v: v.update({(c.Q_ACCOUNT_METHODS, "PSL_ACM_OAUTH"): "true"})))

    def test_extra_row(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = os.path.join(tmp, "x.csv")
            data = open(REFERENCE, "rb").read() + b"\r\nPSL_MADE_UP,,true,OPTIONAL,Made up"
            open(out, "wb").write(data)
            errors, _ = validate(out)
        self.assertTrue(any("not in template" in e for e in errors))


class Knowledge(unittest.TestCase):
    def test_json_in_sync_and_ids_valid(self):
        try:
            import yaml  # noqa: F401
        except ImportError:
            self.skipTest("PyYAML not installed")
        p = run("build_knowledge.py", "--check")
        self.assertEqual(p.returncode, 0, p.stdout + p.stderr)

    def test_every_sdk_cites_a_source(self):
        for s in c.load_knowledge("sdks.json"):
            self.assertTrue(s.get("source", "").startswith("https://"), s["id"])


if __name__ == "__main__":
    unittest.main()
