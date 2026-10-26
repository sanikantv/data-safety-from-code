# SEO report: datasafety.sanikant.dev

Generated after the first build (2026-10-26). Search volumes were **not** checked; verify them in Ahrefs or Google Keyword Planner before changing the homepage target.

## Primary keywords (homepage)

- data safety form generator
- google play data safety form
- data safety csv

## Keyword → page map

| Keyword | Page | Intent |
|---|---|---|
| data safety form generator, data safety section generator | `/` | Tool |
| generate data safety form from code, data safety claude code skill, ai data safety form android | `/getting-started/` | Tool / agent |
| scan android app for data collection, android privacy scanner sdk, android app privacy audit tool | `/how-it-works/` | Tool / agent |
| how to fill data safety form google play | `/guides/how-to-fill-data-safety-form/` | How-to |
| how to import data safety csv, data safety form csv import | `/guides/import-data-safety-csv/` | How-to |
| how to export data safety form | `/guides/export-data-safety-csv/` | How-to |
| what is shared vs collected data safety | `/guides/collected-vs-shared/` | Question |
| what is ephemeral processing data safety | `/guides/ephemeral-processing/` | Question |
| data safety form rejected, app rejected inaccurate data safety | `/guides/data-safety-form-rejected/` | Problem |
| data safety form for app that collects no data | `/guides/app-with-no-data/` | How-to |
| is ip address location data safety | `/guides/ip-address-location/` | Question |
| data safety csv template, play console data safety csv | `/reference/csv-format/` | Reference |
| data safety ephemeral meaning, collected definition | `/reference/definitions/` | Reference |
| admob data safety form | `/sdk/admob/` | SDK |
| firebase analytics data safety | `/sdk/firebase-analytics/` | SDK |
| firebase crashlytics data safety | `/sdk/firebase-crashlytics/` | SDK |
| revenuecat data safety google play | `/sdk/revenuecat/` | SDK |
| google sign in data safety | `/sdk/google-sign-in/` | SDK |
| onesignal data safety form | `/sdk/onesignal/` | SDK |
| facebook sdk data safety | `/sdk/facebook-sdk/` | SDK |
| play billing data safety financial info | `/sdk/play-billing/` | SDK |
| fastlane google data safety, data safety form tool | `/comparison/` | Comparison |
| FAQ-style questions | `/faq/` | Question |

The **SDK pages** are the biggest opportunity: each targets a specific long-tail query, and they're generated from the knowledge base, so every new SDK entry adds a page.

## Structured data

- `SoftwareSourceCode` and `VideoObject` on `/`
- `BreadcrumbList` on every inner page
- `TechArticle` on guides
- `FAQPage` on `/`, `/faq/` and guides with a `faq` block
- `Person` (author) linked to sanikant.dev and GitHub
- No ratings, review counts or download counts.

## Technical

- `sitemap-index.xml` (Starlight), referenced from `robots.txt`
- `llms.txt` for AI search
- Open Graph image per section (`/og/home.png`, `guides`, `sdk`, `reference`, `docs`)
- `npm run check` enforces one H1, unique titles and descriptions (70–200 chars), canonical, OG and Twitter tags, valid JSON-LD, sitemap coverage, no broken links

## Internal linking

Home → Getting started, How it works, SDK list, guides, FAQ. Every SDK page → related SDKs in the same category, the collected-vs-shared guide, the how-to-fill guide, the SDK list. Every guide → related guides, getting started, and relevant SDK pages.

## Recommended next pages

- `/guides/data-safety-form-for-app-with-ads/` (how to fill the form for an app with ads)
- `/guides/is-device-id-collected/` and `/guides/crash-logs-data-collection/` (question keywords)
- One page per additional SDK: AppsFlyer, Adjust, Branch, Amplitude, Unity Ads, AppLovin, Google Maps, Stripe
- The free in-browser generator (upload manifest + Gradle files) on `/`, planned for a later version

## Couldn't verify

- Search volumes and difficulty for every keyword above.
- Google's help page calls the import button "Import to CSV"; the site uses that wording.
- 9 of 21 SDK entries are `inferred` (no official vendor Play disclosure found); their pages say so.

## All pages

| Route | Title | Description | Keywords |
|---|---|---|---|
| `/` | Data safety form generator for Android, from your code \| Data safety from code | Generate the Google Play Data safety CSV from your Android code. An open-source agent skill that cites a file and line or SDK source for every answer. | data safety form generator, google play data safety form, data safety csv, data safety section generator |
| `/changelog/` | Changelog \| Data safety from code | Release notes for data-safety-from-code, the agent skill that generates the Google Play Data safety CSV from Android code. | google play data safety form, data safety csv, data safety form generator |
| `/comparison/` | Ways to Fill the Data Safety Form Compared \| Data safety from code | An honest comparison of filling Google Play's Data safety form by hand, with the fastlane google_data_safety plugin, from SDK vendor guidance, or with data-safety-from-code. | data safety form generator, fastlane google data safety, data safety form tool comparison, automate google play data safety form |
| `/faq/` | Google Play Data Safety Form FAQ \| Data safety from code | Answers to common questions about Google Play's Data safety form, its CSV import and export, SDK data, and what the data-safety-from-code skill does and does not do. | google play data safety form faq, data safety form questions, data safety csv faq, data safety form generator |
| `/getting-started/` | Get started with data-safety-from-code \| Data safety from code | Install the data-safety-from-code skill in Claude Code, Codex, Cursor or Copilot, run it on your Android project, and import the CSV in Play Console. | generate data safety form from code, data safety claude code skill, ai data safety form android |
| `/guides/app-with-no-data/` | Data Safety Form for an App That Collects No Data \| Data safety from code | How to fill Google Play's Data safety form when your app collects no user data, what you still must provide, and the SDKs and features that quietly make "no data" untrue. | data safety form for app that collects no data, data safety no data collected, offline app data safety form, does my app collect data google play |
| `/guides/collected-vs-shared/` | Collected vs Shared in the Data Safety Form \| Data safety from code | The difference between collected and shared data in Google Play's Data safety form, the four transfers that are not sharing, and how common SDKs such as Firebase and AdMob fit. | collected vs shared data safety, data safety shared vs collected, is firebase sharing data safety, service provider data safety form |
| `/guides/data-safety-form-rejected/` | Data Safety Form Rejected? How to Fix an Inaccurate Form \| Data safety from code | Why Google Play flags a Data safety form as inaccurate, where to find the issue in Play Console, and a step-by-step way to find the undeclared data and fix the form or the app. | data safety form rejected, inaccurate data safety form, invalid data safety form google play, fix data safety form issue |
| `/guides/ephemeral-processing/` | What Is Ephemeral Processing in the Data Safety Form? \| Data safety from code | What ephemeral processing means in Google Play's Data safety form, when you can answer yes, why the data is still declared as collected, and what it changes on your store listing. | what is ephemeral processing data safety, processed ephemerally google play, is this data processed ephemerally, ephemeral data safety form |
| `/guides/export-data-safety-csv/` | How to Export the Data Safety Form as a CSV \| Data safety from code | Export your Google Play Data safety form to CSV from Play Console, read what each column means, and use the file as a backup, a diff baseline and an up-to-date template. | how to export data safety form csv, export data safety csv play console, data safety csv template, download data safety form |
| `/guides/how-to-fill-data-safety-form/` | How to Fill the Data Safety Form on Google Play \| Data safety from code | A step-by-step way to fill Google Play's Data safety form, from listing what leaves the device to choosing the purposes for each data type, then previewing and submitting. | how to fill data safety form google play, google play data safety section, data safety form play console, data safety form sdk data |
| `/guides/import-data-safety-csv/` | How to Import a Data Safety CSV in Play Console \| Data safety from code | Import a Data safety CSV in Play Console without losing answers. Back up first, keep Google's row format, fix common import errors, and check the preview before you submit. | how to import data safety csv, import data safety csv play console, data safety csv upload, data safety csv format |
| `/guides/ip-address-location/` | Is an IP Address Location in the Data Safety Form? \| Data safety from code | When an IP address counts as location in Google Play's Data safety form, why it is approximate rather than precise location, and which SDKs derive location from IP addresses. | is ip address location data safety, ip address approximate location google play, data safety form ip address, approximate vs precise location data safety |
| `/how-it-works/` | How data-safety-from-code works, step by step \| Data safety from code | From Android code to an importable Data safety CSV: what the scan reads, how SDKs and code signals become answers, and how the CSV is filled and validated. | scan android app for data collection, android privacy scanner sdk, android app privacy audit tool |
| `/reference/csv-format/` | Data safety CSV format and question IDs \| Data safety from code | The Google Play Data safety CSV explained: its 5 columns, true/false values, answer requirements, and all 782 question and response IDs. | data safety csv template, data safety csv format, play console data safety csv |
| `/reference/definitions/` | Data safety definitions: collected, shared, ephemeral \| Data safety from code | Google Play's Data safety definitions in plain words: collected, shared, ephemeral, optional, service providers, IP as location and Play Billing. | data safety collected definition, data safety shared definition, data safety ephemeral meaning |
| `/sdk/` | Data safety answers for Android SDKs \| Data safety from code | What Firebase, AdMob, RevenueCat, OneSignal, Sentry, Mixpanel and other Android SDKs collect for the Google Play Data safety form, with sources. | android sdk data safety, sdk data safety form google play, third party sdk data safety |
| `/sdk/admob/` | AdMob: Data safety form answers \| Data safety from code | What AdMob collects for the Google Play Data safety form: approximate location, app interactions, diagnostics and more. Purposes, sharing and the exact CSV rows. | admob data safety, admob data safety form, admob google play data safety |
| `/sdk/facebook-sdk/` | Facebook SDK: Data safety form answers \| Data safety from code | What Facebook SDK collects for the Google Play Data safety form: app interactions, device or other IDs, crash logs. Purposes, sharing and the exact CSV rows. | facebook sdk data safety, facebook sdk data safety form, facebook sdk google play data safety |
| `/sdk/firebase-ai-logic/` | Firebase AI Logic: Data safety form answers \| Data safety from code | How to declare Firebase AI Logic in the Google Play Data safety form: what it can collect, when it applies, and the CSV rows to set. | firebase ai logic data safety, firebase ai logic data safety form, firebase ai logic google play data safety |
| `/sdk/firebase-analytics/` | Firebase Analytics: Data safety form answers \| Data safety from code | What Firebase Analytics collects for the Google Play Data safety form: device or other IDs, approximate location, app interactions. Purposes, sharing and the exact CSV rows. | firebase analytics data safety, firebase analytics data safety form, firebase analytics google play data safety |
| `/sdk/firebase-auth/` | Firebase Authentication: Data safety form answers \| Data safety from code | What Firebase Authentication collects for the Google Play Data safety form: user IDs. Purposes, sharing and the exact CSV rows. | firebase authentication data safety, firebase authentication data safety form, firebase authentication google play data safety |
| `/sdk/firebase-crashlytics/` | Firebase Crashlytics: Data safety form answers \| Data safety from code | What Firebase Crashlytics collects for the Google Play Data safety form: crash logs, diagnostics, device or other IDs. Purposes, sharing and the exact CSV rows. | firebase crashlytics data safety, firebase crashlytics data safety form, firebase crashlytics google play data safety |
| `/sdk/firebase-firestore/` | Cloud Firestore: Data safety form answers \| Data safety from code | How to declare Cloud Firestore in the Google Play Data safety form: what it can collect, when it applies, and the CSV rows to set. | cloud firestore data safety, cloud firestore data safety form, cloud firestore google play data safety |
| `/sdk/firebase-installations/` | Firebase Installations: Data safety form answers \| Data safety from code | What Firebase Installations collects for the Google Play Data safety form: device or other IDs. Purposes, sharing and the exact CSV rows. | firebase installations data safety, firebase installations data safety form, firebase installations google play data safety |
| `/sdk/firebase-messaging/` | Firebase Cloud Messaging: Data safety form answers \| Data safety from code | What Firebase Cloud Messaging collects for the Google Play Data safety form: device or other IDs. Purposes, sharing and the exact CSV rows. | firebase cloud messaging data safety, firebase cloud messaging data safety form, firebase cloud messaging google play data safety |
| `/sdk/firebase-perf/` | Firebase Performance Monitoring: Data safety form answers \| Data safety from code | What Firebase Performance Monitoring collects for the Google Play Data safety form: diagnostics, device or other IDs. Purposes, sharing and the exact CSV rows. | firebase performance monitoring data safety, firebase performance monitoring data safety form, firebase performance monitoring google play data safety |
| `/sdk/firebase-remote-config/` | Firebase Remote Config: Data safety form answers \| Data safety from code | What Firebase Remote Config collects for the Google Play Data safety form: device or other IDs. Purposes, sharing and the exact CSV rows. | firebase remote config data safety, firebase remote config data safety form, firebase remote config google play data safety |
| `/sdk/google-ai-client-sdk/` | Gemini API (Google AI client SDK): Data safety form answers \| Data safety from code | How to declare Gemini API (Google AI client SDK) in the Google Play Data safety form: what it can collect, when it applies, and the CSV rows to set. | gemini api (google ai client sdk) data safety, gemini api (google ai client sdk) data safety form, gemini api (google ai client sdk) google play data safety |
| `/sdk/google-sign-in/` | Sign in with Google / Credential Manager: Data safety form answers \| Data safety from code | How to declare Sign in with Google / Credential Manager in the Google Play Data safety form: what it can collect, when it applies, and the CSV rows to set. | sign in with google / credential manager data safety, sign in with google / credential manager data safety form, sign in with google / credential manager google play data safety |
| `/sdk/mixpanel-android/` | Mixpanel Android SDK: Data safety form answers \| Data safety from code | What Mixpanel Android SDK collects for the Google Play Data safety form: app interactions, device or other IDs, approximate location. Purposes, sharing and the exact CSV rows. | mixpanel android sdk data safety, mixpanel android sdk data safety form, mixpanel android sdk google play data safety |
| `/sdk/ml-kit/` | ML Kit: Data safety form answers \| Data safety from code | What ML Kit collects for the Google Play Data safety form: device or other IDs, diagnostics. Purposes, sharing and the exact CSV rows. | ml kit data safety, ml kit data safety form, ml kit google play data safety |
| `/sdk/onesignal/` | OneSignal Android SDK: Data safety form answers \| Data safety from code | What OneSignal Android SDK collects for the Google Play Data safety form: app interactions. Purposes, sharing and the exact CSV rows. | onesignal android sdk data safety, onesignal android sdk data safety form, onesignal android sdk google play data safety |
| `/sdk/openai-client/` | OpenAI client libraries: Data safety form answers \| Data safety from code | How to declare OpenAI client libraries in the Google Play Data safety form: what it can collect, when it applies, and the CSV rows to set. | openai client libraries data safety, openai client libraries data safety form, openai client libraries google play data safety |
| `/sdk/play-billing/` | Google Play Billing Library: Data safety form answers \| Data safety from code | How to declare Google Play Billing Library in the Google Play Data safety form: what it can collect, when it applies, and the CSV rows to set. | google play billing library data safety, google play billing library data safety form, google play billing library google play data safety |
| `/sdk/revenuecat/` | RevenueCat: Data safety form answers \| Data safety from code | What RevenueCat collects for the Google Play Data safety form: purchase history. Purposes, sharing and the exact CSV rows. | revenuecat data safety, revenuecat data safety form, revenuecat google play data safety |
| `/sdk/sentry-android/` | Sentry Android SDK: Data safety form answers \| Data safety from code | What Sentry Android SDK collects for the Google Play Data safety form: crash logs, diagnostics, device or other IDs. Purposes, sharing and the exact CSV rows. | sentry android sdk data safety, sentry android sdk data safety form, sentry android sdk google play data safety |
| `/sdk/user-messaging-platform/` | Google UMP SDK: Data safety form answers \| Data safety from code | How to declare Google UMP SDK in the Google Play Data safety form: what it can collect, when it applies, and the CSV rows to set. | google ump sdk data safety, google ump sdk data safety form, google ump sdk google play data safety |
