---
'@uppy/aws-s3': minor
---

**Behaviour change for single-request uploads through Companion:** the `location` in the upload response now has the object key URL-escaped, with `/` kept (for example, a space becomes `%20`), because Companion and `signRequest` POST uploads now share one code path. If you store or compare `location`, or work out the key from it, decode it first.

`signRequest` may return `fields` to upload with an S3 POST policy. This works for single-request (non-multipart) uploads only. The signer also now receives `contentType` on the PutObject request.
