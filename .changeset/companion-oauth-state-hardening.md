---
"@uppy/companion": patch
---

Security: harden how Companion stores and decodes the OAuth state when provider credentials come from a credentials endpoint that returns `origins`. Companion now ignores an `authCallbackToken` that is not a UUID, and posts the auth token to older Uppy clients (via `postMessage`) only to a state origin that is a plain `scheme://host[:port]` (a trailing slash is allowed).
