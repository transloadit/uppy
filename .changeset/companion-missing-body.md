---
'@uppy/companion': patch
---

Return 400 instead of 500 when `/url/meta`, `/url/get` or the S3 multipart endpoints receive a request without a JSON body (Express 5 leaves `req.body` undefined).
