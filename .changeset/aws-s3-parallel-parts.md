---
'@uppy/aws-s3': minor
---

Upload the parts of a multipart upload in parallel. `limit` now bounds concurrent uploads across files and parts, as in v5: every file starts right away and they share the pool, and `s3-multipart:part-uploaded` fires in completion order rather than part order. Removing the plugin mid-upload now settles the upload promise.
