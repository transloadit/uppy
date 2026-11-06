---
"@uppy/companion": patch
---

Stop logging the WebDAV URL when connecting to a WebDAV server fails. The raw error included the request URL, and for a share link that URL is the credential. The login error is now mapped like every other WebDAV error, so a rejected login returns 401 (and other server errors 424/502) instead of 500.
