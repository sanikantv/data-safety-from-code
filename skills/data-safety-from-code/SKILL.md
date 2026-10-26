---
name: data-safety-from-code
description: >
  Scan an Android codebase and generate the Google Play Data safety form as a CSV that Play
  Console can import (App content → Data safety → Import to CSV), with an evidence report
  that ties every answer to a file:line or an SDK vendor's official disclosure. Reads
  AndroidManifest.xml, build.gradle(.kts), libs.versions.toml and Kotlin/Java source; knows
  what Firebase, AdMob, RevenueCat, Play Billing, OneSignal, Sentry, Mixpanel, Meta and other
  SDKs collect. Use when the user asks to fill, generate, update, audit or fix the Data safety
  form, section or CSV, or asks what data their Android app collects or shares.
---

# Data safety form from code

The output is a **draft for the developer to review**, never a compliance guarantee. Google holds the developer responsible for the declaration. Never call the result "compliant" or "guaranteed".

Scripts live in `scripts/` next to this file. They need Python 3.9+ and nothing else (`build_knowledge.py` also needs PyYAML, but only for editing the knowledge base). Run them with the paths shown, from any directory. Work files go in a `data-safety/` folder in the user's project, so they're easy to review and delete; suggest adding it to `.gitignore` if the user doesn't want it committed.

## Rules

1. **Never invent rows.** The CSV must be Google's template row for row. Only the scripts write it: `fill_csv.py` changes only the *Response value* column. Don't hand-edit the CSV.
2. **Every `true` needs evidence**: an SDK entry with an official source, or code at `file:line`, or the developer's own answer. If you can't point to evidence, it goes to *Needs your review*, not into the form.
3. **Collected = leaves the device.** Reading data with a permission isn't collection. Read `knowledge/definitions.md` before judging anything the scan flags (shared vs service provider, ephemeral, IP-as-location, Play Billing).
4. **Ask only what code can't show**, in one batch, not one question at a time.
5. **Importing overwrites the whole form.** Tell the user to export a backup first.

## Workflow

### 1. Get the template

Ask the user for their current export: Play Console → **App content → Data safety → Export to CSV** (top right of the Data safety page). It's always the latest version of Google's questions, and it holds their current answers (used for non-code questions and for a "what changed" diff). Save it as `data-safety/current.csv`.

If they don't have one (new app, no access), use the bundled `template/data_safety_template.csv` and say so. If `fill_csv.py` later reports a row the template doesn't have, the bundled template is out of date: ask for a fresh export.

### 2. Scan

```bash
python3 <skill>/scripts/scan.py <project> -o data-safety/findings.json
```

For a better scan, if the project builds, also run these. Ask before running Gradle if it might be slow or need network access.

```bash
./gradlew :app:dependencies --configuration releaseRuntimeClasspath > data-safety/deps.txt
python3 <skill>/scripts/scan.py <project> -o data-safety/findings.json --gradle-deps data-safety/deps.txt
```

`--gradle-deps` catches SDKs pulled in transitively. A release build (`./gradlew :app:processReleaseMainManifest`) lets the scan see permissions that libraries add through manifest merging.

### 3. Judge the evidence (your job, not the scripts')

Read `findings.json`:

- `sdks`: matched against `knowledge/sdks.json`. Unconditional entries go in automatically. Entries with a `condition` don't: check the condition in the code (e.g. "only if you call `setUserId`" → search for `setUserId`) and include each one that applies via `include_conditional`.
- `signals`: code that may send data off the device (HTTP clients, uploads, Firestore writes, analytics events, AI requests, sign-in). Open the file at each `file:line`, follow the data, and decide which data type leaves the device, whether a third party gets it, and why. Record each decision under `add` in `answers.json` with `reason` and `evidence`.
- `permissions`: `used_in_code: false` on a sensitive permission → tell the user to remove it unless a library needs it. Don't declare its data.
- `unknown_dependencies`: libraries not in the knowledge base. For any that could send data (analytics, ads, attribution, crash, chat, maps with tracking), look up the vendor's Play data-disclosure page and add the data via `add` with the vendor URL in `reason`. Ignore UI and utility libraries.
- `network.encrypted_in_transit_suggestion`: `false` when plain HTTP is used, `null` when it needs a human look.

### 4. Ask the developer what code can't show

Ask in one message, with your suggested answer for each where the code hints at one:

- Privacy policy URL (Play requires one for every app, even one that collects no data)
- How users create accounts (none / username+password / OAuth / other), and the account deletion URL if they can
- Can users request data deletion? (yes + URL / no / data auto-deleted within 90 days)
- Does your **backend** send any of this data to third parties?
- For each collected data type: is it required, or can the user choose (an opt-out the app actually honors)?
- Anything the app's servers receive that isn't visible in the client (e.g. data from a web dashboard)
- If the app targets children: show the Families commitment badge?

### 5. Write `data-safety/answers.json`

```json
{
  "privacy_policy_url": "https://example.com/privacy",
  "account_creation": ["PSL_ACM_OAUTH"],
  "account_creation_other": "",
  "account_deletion_url": "https://example.com/delete-account",
  "data_deletion": "yes",
  "data_deletion_url": "https://example.com/delete-data",
  "outside_app_accounts": false,
  "encrypted_in_transit": null,
  "user_control": {"default": "required", "PSL_EMAIL": "optional"},
  "ephemeral": {"PSL_APPROX_LOCATION": true},
  "include_conditional": ["firebase-auth:PSL_EMAIL"],
  "exclude_sdks": {"some-sdk-id": "only in the internal build, not on Play"},
  "add": [
    {
      "type": "PSL_PHOTOS",
      "collected": true,
      "shared": false,
      "ephemeral": true,
      "purposes": ["PSL_APP_FUNCTIONALITY"],
      "sharing_purposes": [],
      "reason": "Photo is sent to the AI API to describe it and is not stored",
      "evidence": ["app/src/main/java/com/example/Describe.kt:42"]
    }
  ],
  "remove": [{"type": "PSL_DEVICE_ID", "sdk": "admob", "reason": "..."}]
}
```

- `account_creation` values: `PSL_ACM_USER_ID_PASSWORD`, `PSL_ACM_USER_ID_OTHER_AUTH`, `PSL_ACM_USER_ID_PASSWORD_OTHER_AUTH`, `PSL_ACM_OAUTH`, `PSL_ACM_OTHER`, `PSL_ACM_NONE`.
- `data_deletion`: `yes`, `no` or `auto_deleted_90_days`.
- Data type and purpose IDs: the `PSL_*` IDs in the template (see `knowledge/definitions.md`).
- `encrypted_in_transit`: leave `null` to use the scan's answer.
- Omit a key to fall back to the current export (when `--current` is given), then to "unanswered".
- An `add` for a type an SDK already declared merges with it: use that to add a purpose an SDK entry leaves empty.

### 6. Draft, fill, validate

```bash
python3 <skill>/scripts/draft.py data-safety/findings.json --answers data-safety/answers.json \
  --current data-safety/current.csv -o data-safety/declaration.json
python3 <skill>/scripts/fill_csv.py data-safety/declaration.json --template data-safety/current.csv \
  -o data-safety/data_safety.csv
```

Leave out `--current` / `--template` when there's no export. `draft.py` prints `UNANSWERED` and `REVIEW` lines: resolve each one, either by asking the user or by updating `answers.json`, and run it again. `fill_csv.py` validates as it writes. Fix every `ERROR` through `answers.json` (never in the CSV) until there are none. Stand-alone check: `python3 <skill>/scripts/validate.py data-safety/data_safety.csv --template data-safety/current.csv`.

### 7. Report

```bash
python3 <skill>/scripts/report.py data-safety/findings.json data-safety/declaration.json \
  --current data-safety/current.csv -o data-safety/data_safety_report.md
```

Then tell the user, briefly:

- which data types are declared and why (the main SDKs and code paths)
- what changed compared to their current form, especially anything **added**, since a form that under-declares is the usual reason for rejection
- what still needs their review (conditional SDK data, unknown libraries, unused permissions, plain HTTP)
- the next step: open the report, then in Play Console → App content → Data safety → **Export to CSV** (backup) → **Import to CSV** → `data_safety.csv` → check the preview → Save → Submit

An example report is in `examples/report_example.md`.

### Optional: upload with the API

Only if the user asks and already uses a Play service account in CI: see `knowledge/upload.md`. Never handle the key yourself.

## Updating the knowledge base

Each SDK entry in `knowledge/sdks.yaml` must cite the vendor's own Play data-disclosure page in `source`, with `confidence: official`. If there is no such page, use `confidence: inferred` and explain in `notes`. After editing, run `python3 scripts/build_knowledge.py`, which regenerates `sdks.json` and checks every ID against the template.
