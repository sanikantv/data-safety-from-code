# Changelog

## 0.1.0 (unreleased)

- First version.
- `scan.py`: manifests (including merged release manifests), Groovy and Kotlin DSL Gradle files,
  version catalogs and bundles, `./gradlew dependencies` output, network security config,
  plain-HTTP URLs, and 20 kinds of source signals (HTTP clients, uploads, Firestore writes,
  analytics events, AI requests, sign-in methods, identifiers…).
- `draft.py`, `fill_csv.py`, `validate.py`, `report.py`: declaration → CSV that keeps Google's
  template byte for byte, validation of every conditional question, evidence report with a
  diff against the current Play Console form.
- Knowledge base: 21 SDK entries (12 from official vendor disclosure pages) and 29 permissions.
- Tests: four fixture apps with golden CSVs, a byte-identical round trip of a real export,
  validator failure cases.
