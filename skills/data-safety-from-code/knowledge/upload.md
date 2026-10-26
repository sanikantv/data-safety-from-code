# Optional: upload the CSV without opening Play Console

The default is a manual import (Play Console → App content → Data safety → Import to CSV), because the developer should see the preview before saving. Offer the options below only to developers who already publish from CI with a service account.

## Play Developer API

`POST https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{packageName}/dataSafety`

The body is `{"safetyLabels": "<the full CSV contents as a string>"}`. It needs a service account with access to the app in Play Console (Users and permissions) and the `https://www.googleapis.com/auth/androidpublisher` scope. Reference: [applications.dataSafety](https://developers.google.com/android-publisher/api-ref/rest/v3/applications/dataSafety).

Like the manual import, this replaces the whole Data safety form.

## fastlane

The community plugin [`fastlane-plugin-google_data_safety`](https://rubygems.org/gems/fastlane-plugin-google_data_safety) has an `upload_google_data_safety` action that sends a CSV with the same API:

```ruby
upload_google_data_safety(
  csv_file: "data_safety.csv",
  package_name: "com.example.app",
  json_key: "play-service-account.json"
)
```

Check the plugin's README for the current parameter names before you use it.

## Rules for the agent

- Never upload without the developer saying so in this conversation, and only after `validate.py` passes and they've read the report.
- Never ask for, print or store the service account key. The developer runs the upload command themselves, or points to a key file they already have.
