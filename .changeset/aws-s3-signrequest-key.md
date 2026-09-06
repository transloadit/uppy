---
"@uppy/aws-s3": minor
---

`signRequest` can now return the object key it signed for, as `key` next to `url`. When a signing server stores the object under a different key than the one Uppy proposed (a directory prefix, a server-generated name), returning `{ url, key }` from the request that creates the upload, the single-part `PUT`, or the multipart create, makes Uppy use that key for the rest of the upload and report it in `upload-success`. Previously the client-generated key was reported even when the server had stored the object elsewhere (#6496).

`key` is optional. Signers that return only `{ url }` are unchanged. Requests that carry an `uploadId` must be signed for the key they receive; a `key` returned on those requests is ignored.
