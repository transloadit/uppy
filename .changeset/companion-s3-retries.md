---
"@uppy/aws-s3": patch
---

Retry transient failures (network errors, 5xx, 429) of Companion requests in `companionEndpoint` mode, and expose the response status on the error via `error.request.status`.
