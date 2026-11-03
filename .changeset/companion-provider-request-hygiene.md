---
'@uppy/companion': patch
---

Security: client-supplied ids are percent-encoded in Box, OneDrive, Facebook and Unsplash API paths, so a crafted id can no longer redirect a provider call to a different endpoint. Abandoned thumbnail requests now destroy the provider stream (returning its socket to the pool), and `res.write` keeps its backpressure flag on every route because the grant error interceptor runs only on the OAuth callback path. A refused import, or one whose progress socket never connects, destroys its download instead of leaking the socket and decompressor. Requests to URL-import and WebDAV servers that accept the connection but never answer now time out. Log lines are capped at 10 000 characters and errors are logged without their request options (which carry the Authorization header and uploadHeaders). The standalone access log censors the OAuth `code` and `authCallbackToken` query values.
