---
'@uppy/companion': patch
---

Upgrade Got to version 16 while preserving streamed multipart uploads and Google Drive pagination. A failed multipart upload now logs the destination's status code instead of Got's error message, which names the full URL including any presigned query.
