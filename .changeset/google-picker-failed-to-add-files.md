---
"@uppy/core": patch
---

Google Picker: when the picked files can't be added, show "Failed to add files" instead of the raw `failedToAddFiles` key. The string only existed in @uppy/status-bar's locale, so it was missing unless the full `@uppy/locales` language pack was loaded. It is now part of @uppy/core's locale.
