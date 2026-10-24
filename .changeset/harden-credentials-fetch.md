---
'@uppy/companion': patch
---

Time out remote provider credential requests after 10 seconds and stop following redirects from the configured credentials endpoint (`credentialsURL` / `COMPANION_*_KEYS_ENDPOINT`). If your endpoint URL redirects (for example http → https), configure the final URL; a redirect now fails with an error naming its target.
