---
"@uppy/companion": patch
---

Fix WebDAV provider bypassing SSRF protection: requests to private, loopback and link-local addresses are now blocked unless `allowLocalUrls` is enabled.
