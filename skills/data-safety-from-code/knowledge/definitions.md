# Data safety definitions the skill must get right

Source: [Provide information for Google Play's Data safety section](https://support.google.com/googleplay/android-developer/answer/10787469) (Play Console Help). Where this file and that page disagree, the page wins. Re-read it when in doubt.

## Collected

Data is **collected** when it is transmitted off the user's device: to your servers, to an SDK vendor, or anywhere else.

- Data processed only on the device (on-device ML Kit, a local Room database, DataStore, SharedPreferences) is **not collected**.
- Reading data with a permission is not collecting it. Collection starts when the data, or something derived from it, leaves the device.
- SDKs count. Whatever an SDK in your app sends counts as collected by your app.
- Data sent through WebViews you open counts when your app is the one that collects it. Third-party web content the user navigates to does not.

## Shared

Data is **shared** when it is transferred to a third party. These are **not sharing**:

- Transfers to a **service provider** that processes the data on your behalf and under your instructions (Firebase, Crashlytics, RevenueCat, your cloud host). Declare it as collected.
- Transfers the **user initiates** and reasonably expects, e.g. sharing a photo to another app through the share sheet.
- Transfers for **legal** reasons (law enforcement requests).
- Data that is fully **anonymized** so it can't be linked to a person.

Ad networks (AdMob, Meta Audience Network) generally **share**: the ad network uses the data for its own purposes.

## Ephemeral

Processing is **ephemeral** when data is kept only in memory and only as long as needed to serve one real-time request (e.g. sending coordinates to a weather API that doesn't store them). Ephemeral data must still be declared as collected; you answer "yes" to the ephemeral question. Answer "yes" only if **every** collection of that data type is ephemeral.

## Required vs optional

**Optional** means the user can choose not to provide the data and still use the app (an optional profile field, an analytics opt-out the app actually honors). Data that is always collected, such as SDK analytics without an opt-out, is **required**. The scan can't see your UI, so this is usually a question for the developer.

## Special cases

- **IP address used to derive location** must be declared as **Approximate location**.
- **Payments through Google Play Billing**: card details are handled by Google, so you don't declare financial info for them. Purchase history is collected if your app or backend (or RevenueCat) stores or verifies purchases.
- **Account creation**: if users can create an account, you must provide an **account deletion URL** (and in-app deletion).
- **Permission declared, data never used or sent**: don't declare the data. Remove the permission instead, because unused sensitive permissions are a policy problem on their own.
- **Encryption in transit**: answer yes only if *all* collected data travels over TLS. Any plain `http://` endpoint that receives user data means no.
- **One form covers every version**: if any version still distributed on Play collects a data type, declare it.
- **Families**: if the app targets children, it must follow the Families policy. The badge question is optional.

## Purposes (Response IDs)

| Response ID | Meaning |
|---|---|
| `PSL_APP_FUNCTIONALITY` | Features of the app, e.g. syncing, sign-in, the main function |
| `PSL_ANALYTICS` | Understanding how people use the app, crash and performance reports |
| `PSL_DEVELOPER_COMMUNICATIONS` | Push notifications and emails about the app |
| `PSL_FRAUD_PREVENTION_SECURITY` | Fraud prevention, security, compliance |
| `PSL_ADVERTISING` | Ads or marketing, including measuring ad performance |
| `PSL_PERSONALIZATION` | Customizing content or recommendations |
| `PSL_ACCOUNT_MANAGEMENT` | Setting up and managing the user's account |
