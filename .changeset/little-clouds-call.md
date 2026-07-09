---
"@uppy/tus": major
---

@uppy/tus: don't abort the request on error, so the server response (status + body) is forwarded to the `upload-error` event and `file.response` instead of being reset to status `0`.
