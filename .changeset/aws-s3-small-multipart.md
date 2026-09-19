---
'@uppy/aws-s3': patch
---

`shouldUseMultipart: true` (or a function returning `true`) is now honored for files of 5 MiB or smaller, as it was in v5. S3 only requires 5 MiB for parts other than the last, so a small file is a valid one-part multipart upload. Empty files are still sent with a single PUT.
