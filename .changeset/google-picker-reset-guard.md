---
"@uppy/core": patch
---

Prevent concurrent Google Picker opening requests: overlapping `show()` calls now share one request. A request started before the controller is reset (for example on unmount, or React StrictMode's double mount) no longer opens a picker or an auth popup, saves a stale access token, or changes the loading state of the next request. If reading the stored access token fails, the next request reads it again instead of failing with the same error until the picker is remounted.
