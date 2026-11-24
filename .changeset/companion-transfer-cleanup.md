---
'@uppy/companion': patch
---

Companion cleans up failed and cancelled transfers more reliably:

- Source streams are destroyed on every exit, and a stalled transfer is abandoned. A multipart or S3 upload request that makes no progress for 10 minutes is stopped; for S3 the limit grows with `chunkSize`, since S3 reports progress only per stored part.
- An abandoned or cancelled multipart upload request is aborted, and so is an S3 multipart upload (a file that fits in a single S3 part may still be stored).
- Downloads and uploads refuse an upstream protocol upgrade.
- A pause and resume no longer start a tus upload again while it is still running, and cancelling no longer deletes a tus upload Companion didn't create.
- When resuming a tus upload, the server's offset and length are checked against the file.
- With a fixed `Authorization` header, credentials in the tus or upload URL are dropped.
- URL imports, URL metadata lookups and Google Picker downloads ask for uncompressed responses, and fail if the server compresses them anyway instead of decompressing them.
- Upload requests no longer forward client method-override headers.
