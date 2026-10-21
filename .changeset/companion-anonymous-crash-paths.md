---
'@uppy/companion': patch
---

Security: close several ways an anonymous client could crash or stall the Companion process. WebSocket messages are capped at 1 KiB; WebDAV responses are capped at 5 MiB, list item ids come from the server's paths, and a refused WebDAV download rejects instead of crashing; URL imports no longer buffer error bodies and no longer retry one-shot PUT uploads; request bodies with `Content-Encoding` are rejected with 415 instead of being inflated; the standalone access log no longer re-parses malformed URLs.
