---
"@uppy/aws-s3": patch
---

Document that `signRequest` should return `key` whenever the signing server
stores the object under a different key, even when you don't read the key back.
Without it, `upload-success` reports the requested key for a single-part `PUT`
but the key S3 echoes in `CompleteMultipartUploadResult` for a multipart upload,
so the same signer reports a different key depending on the file's size.
