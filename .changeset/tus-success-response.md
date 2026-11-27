---
"@uppy/companion": minor
---

Pass on a tus destination's JSON answer to the upload's last request in the `success` payload, so `upload-success` gets it as `response.body`, as with multipart uploads. Answers without a body, or with one that is not JSON, are left out as before.
