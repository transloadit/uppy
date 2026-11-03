---
'@uppy/companion': patch
---

Security: close several ways an anonymous client could crash or stall the Companion process. WebSocket messages are capped at 1 KiB; WebDAV listing and stat responses are capped at 5 MiB (larger listings are rejected), list item ids come from the server's paths, and a refused or failing WebDAV download rejects instead of crashing; URL imports follow redirects themselves, drop `authorization`/`cookie` headers across origins, no longer buffer (or proxy to the client) error bodies, and no longer retry one-shot PUT uploads; request bodies with `Content-Encoding` are rejected with 415 instead of being inflated; the standalone access log no longer re-parses malformed URLs.
