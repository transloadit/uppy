---
'@uppy/aws-s3': minor
---

`signRequest` may return `fields` to upload with an S3 POST policy. Single-request (non-multipart) uploads only; the signer now also receives `contentType` on the PutObject request.
