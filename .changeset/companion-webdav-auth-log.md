---
"@uppy/companion": patch
---

Stop logging the WebDAV URL when a request to a WebDAV server fails. A failed connection (refused, DNS, TLS, timeout) or a URL with `user:pass@` produced an error quoting the full URL, which can itself be the credential; the log now shows only its origin. The login error is also mapped like every other WebDAV error, so a rejected login returns 401 (and other server errors 424/502) instead of 500.
