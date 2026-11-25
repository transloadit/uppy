---
"@uppy/core": patch
"@uppy/s3": patch
---

Say when connecting to a provider fails, and let it be retried.

- A failed login now shows the connect screen again, so the user can retry. Before, when S3 auto-connected and Companion could not be reached, the plugin showed an empty folder with no way to connect.
- S3 and Transloadit Storage: a `getGrant()` that rejects now shows "Connection with Companion failed", like a failed request, instead of only being logged. Its message is not shown; a `UserFacingApiError` it throws is still shown as is.
- An OAuth login that cannot reach Companion for its pre-auth token (with `companionKeysParams`) now shows "Connection with Companion failed" instead of only being logged.
