---
"@uppy/companion": patch
---

Stop logging the WebDAV URL when a request to a WebDAV server fails. A failed connection (refused, DNS, TLS) or a URL with `user:pass@` produced an error quoting the full URL, which can itself be the credential; the log now shows only its origin (scheme, host and port). The login error is also mapped like every other WebDAV error, so a rejected login returns 401 (and other server errors 424/502) instead of 500.
