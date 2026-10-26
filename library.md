# Library information

Single source of truth for the site (`site/src/lib/site.ts` mirrors these values).

## Project
Name: data-safety-from-code
Tagline: Google Play Data safety form, filled from your code
Repository: https://github.com/sanikantv/data-safety-from-code
Site: https://datasafety.sanikant.dev
Version: 0.1.0 (unreleased)
License: MIT
Author: Sanikant (https://sanikant.dev)

## Install
Claude Code: `/plugin marketplace add sanikantv/data-safety-from-code`, then `/plugin install data-safety-from-code@data-safety-from-code`
Other agents: `npx --yes skills add sanikantv/data-safety-from-code --skill data-safety-from-code -y`
Requirements: Python 3.9+ (standard library only); PyYAML only to edit the knowledge base

## Positioning
What it does: scans an Android codebase and writes the Play Console Data safety CSV, with an evidence report.
Different from questionnaire tools: answers come from the code and SDK vendor disclosures, each with file:line or a source link.
Not: a compliance guarantee. Output is a draft; the developer is responsible.
Target: Android developers, indie and small teams, agencies maintaining many apps.

## Facts used on the site (verified)
- Template: 782 rows, 5 columns, 38 data types, 7 purposes, 19 usage rows per type; values lowercase true/false.
- Play Console: App content → Data safety → Export to CSV / Import to CSV (Google's wording); importing overwrites the form.
- Knowledge base: 21 SDK entries, 12 `official`, 9 `inferred`; 29 permissions.
- Scan signals: 20 kinds.
- Tests: 18 (four fixture apps, round trip of a real export, validator cases).
- Intro video: 46 s, 1920×1080.

## Public interface
| Script | Purpose |
|---|---|
| `scan.py <project>` | findings.json with file:line evidence |
| `draft.py findings.json --answers --current` | declaration.json |
| `fill_csv.py declaration.json --template` | data_safety.csv (validates) |
| `validate.py data_safety.csv --template` | errors and warnings |
| `report.py findings.json declaration.json --current` | data_safety_report.md |
| `build_knowledge.py [--check]` | sdks.yaml/permissions.yaml → JSON |

## Media
See MEDIA.md.
