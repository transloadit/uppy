---
'@uppy/companion': patch
---

Security: upload destinations are normalized before the `uploadUrls` check and the normalized URL is what Companion connects to, closing a mismatch between the allowlist parser and the client that connected; dot segments can no longer escape a path-anchored allowlist entry. Raw (`useFormData: false`) multipart uploads now fail when the source sends more or fewer bytes than its announced size, instead of letting surplus bytes be framed as a separate request on the keep-alive connection. tus upload URLs returned by the server and multipart redirect targets are re-checked against `uploadUrls`, and `Forwarded` / `X-Forwarded-*` client headers are no longer forwarded to the upload destination.
