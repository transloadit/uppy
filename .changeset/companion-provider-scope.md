---
"@uppy/companion": minor
---

Add `providerOptions[provider].scope` to replace the OAuth scopes Companion requests from a provider, for example to ask OneDrive for `Files.Read` instead of `Files.Read.All`, and `providerOptions[provider].customParams` to add parameters to its authorization URL, for example Dropbox `force_reapprove` so users can switch accounts. Dropbox scopes are now sent space-separated, as Dropbox expects.
