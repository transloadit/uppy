---
"@uppy/companion": patch
---

Fix multipart form-data uploads (the default for XHR uploads through Companion) sending an empty or truncated file (missing its first bytes) and reporting success when `maxFileSize` is set in streaming upload mode, a regression in 7.2.1. The stream that counts bytes against `maxFileSize` started flowing before the form-data body read it, so those bytes were lost.
