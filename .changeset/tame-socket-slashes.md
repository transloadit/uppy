---
"@uppy/core": patch
---

Strip all trailing slashes from `companionUrl` (previously only one was stripped for HTTP requests, and none for websockets), so a `companionUrl` ending in `/` no longer produces `ws://host//api/...` and breaks remote uploads.
