---
'@uppy/aws-s3': minor
---

`signRequest` may return `fields` to upload with an S3 POST policy. Single-request (non-multipart) uploads only; the signer now also receives `contentType` on the PutObject request. Companion and `signRequest` POST uploads now share one code path, so the Companion `location` now escapes the key (e.g. a space becomes `%20`).
