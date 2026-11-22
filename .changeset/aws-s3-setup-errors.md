---
"@uppy/aws-s3": patch
---

Report local uploads that fail before they start, for example when `crypto.randomUUID` is missing outside a secure context. The file now gets an `upload-error` and is listed as failed, instead of staying at 0% and being counted as successful.
