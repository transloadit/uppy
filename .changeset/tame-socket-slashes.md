---
"@uppy/core": patch
---

Strip trailing slashes from `companionUrl` when building the websocket URL, so a `companionUrl` ending in `/` no longer produces `ws://host//api/...` and breaks remote uploads.
