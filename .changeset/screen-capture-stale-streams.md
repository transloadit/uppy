---
"@uppy/screen-capture": patch
---

Stop screen and microphone streams that would otherwise stay live.

- A screen or microphone stream that resolves after `stop()` (unmounting or removing the plugin while the picker is open, or React StrictMode's double mount) is now stopped instead of staying live.
