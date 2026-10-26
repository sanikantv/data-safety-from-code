# Data safety draft — admob-only

> **Draft for review.** This was generated from the code by `data-safety-from-code`. You, the developer, are responsible for what you declare in Play Console. Check every answer below, especially the items under *Needs your review* and *Could not verify*.

Scanned `~/projects/admob-only` on 2026-10-26.

## Summary

- Collects or shares user data: **Yes**
- Encrypted in transit: **Yes** (scan: no http:// URLs and no cleartext permission found)
- Account creation: **No account creation** (answer)
- Users can request deletion: **No**
- Privacy policy: https://example.com/privacy

| Data type | Collected | Shared | Ephemeral | Required / optional | Purposes |
|---|---|---|---|---|---|
| Location / Approximate location | Yes | Yes | No | required | Analytics, Fraud prevention, security and compliance, Advertising or marketing · shared for: Analytics, Fraud prevention, security and compliance, Advertising or marketing |
| App info and performance / Diagnostics | Yes | Yes | No | required | Analytics, Fraud prevention, security and compliance, Advertising or marketing · shared for: Analytics, Fraud prevention, security and compliance, Advertising or marketing |
| App activity / App interactions | Yes | Yes | No | required | Analytics, Fraud prevention, security and compliance, Advertising or marketing · shared for: Analytics, Fraud prevention, security and compliance, Advertising or marketing |
| Device or other IDs / Device or other IDs | Yes | Yes | No | required | Analytics, Fraud prevention, security and compliance, Advertising or marketing · shared for: Analytics, Fraud prevention, security and compliance, Advertising or marketing |

## Evidence for each data type

### Location / Approximate location

- **Google Mobile Ads SDK (AdMob) (com.google.android.gms:play-services-ads)** — `app/build.gradle.kts:17` — collected + shared — Advertising or marketing, Analytics, Fraud prevention, security and compliance — [vendor disclosure](https://developers.google.com/admob/android/privacy/play-data-disclosure)

### App info and performance / Diagnostics

- **Google Mobile Ads SDK (AdMob) (com.google.android.gms:play-services-ads)** — `app/build.gradle.kts:17` — collected + shared — Advertising or marketing, Analytics, Fraud prevention, security and compliance — [vendor disclosure](https://developers.google.com/admob/android/privacy/play-data-disclosure)

### App activity / App interactions

- **Google Mobile Ads SDK (AdMob) (com.google.android.gms:play-services-ads)** — `app/build.gradle.kts:17` — collected + shared — Advertising or marketing, Analytics, Fraud prevention, security and compliance — [vendor disclosure](https://developers.google.com/admob/android/privacy/play-data-disclosure)

### Device or other IDs / Device or other IDs

- **Google Mobile Ads SDK (AdMob) (com.google.android.gms:play-services-ads)** — `app/build.gradle.kts:17` — collected + shared — Advertising or marketing, Analytics, Fraud prevention, security and compliance — [vendor disclosure](https://developers.google.com/admob/android/privacy/play-data-disclosure)

## SDKs found

| SDK | Declared in | Source | Confidence |
|---|---|---|---|
| Google Mobile Ads SDK (AdMob) | `app/build.gradle.kts:17` (release) | [link](https://developers.google.com/admob/android/privacy/play-data-disclosure) | official |

## Changes compared to your current form

- **Added** Location / Approximate location
- **Added** App info and performance / Diagnostics
- App activity / App interactions: user_control optional → required
- App activity / App interactions: collection purposes Advertising or marketing → Analytics, Fraud prevention, security and compliance, Advertising or marketing
- App activity / App interactions: sharing purposes Advertising or marketing → Analytics, Fraud prevention, security and compliance, Advertising or marketing
- Device or other IDs / Device or other IDs: user_control optional → required
- Device or other IDs / Device or other IDs: collection purposes Advertising or marketing → Analytics, Fraud prevention, security and compliance, Advertising or marketing
- Device or other IDs / Device or other IDs: sharing purposes Advertising or marketing → Analytics, Fraud prevention, security and compliance, Advertising or marketing
- encrypted in transit: False → True
- data deletion: None → no

## Could not verify from code

- What your **backend** does with the data it receives, and whether it passes data to third parties.
- Data collected by **older versions** still installed by users: one form covers every version on Play.
- SDK behavior that depends on console settings (e.g. Analytics data sharing, Google Signals, ad personalization).
- Data entered in **WebViews** or third-party UIs your app shows.
- No merged release manifest found under build/. Permissions added by libraries are not listed; run ./gradlew :app:processReleaseMainManifest (or a release build) and scan again to include them.
- Only directly declared dependencies were matched. For transitive SDKs run ./gradlew :app:dependencies --configuration releaseRuntimeClasspath > deps.txt and pass --gradle-deps deps.txt.

## Next steps

1. Read this report and fix anything wrong in `answers.json`, then run `draft.py` and `fill_csv.py` again.
2. In Play Console open **App content → Data safety**, and **Export to CSV** first as a backup: importing replaces every answer in the form.
3. **Import to CSV**, choose `data_safety.csv`, check the preview, then save and submit.
