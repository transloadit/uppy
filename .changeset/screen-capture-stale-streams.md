---
"@uppy/screen-capture": patch
---

Stop screen and microphone streams that would otherwise stay live.

- A screen or microphone stream that resolves after `stop()` (unmounting or removing the plugin while the picker is open, or React StrictMode's double mount) is now stopped instead of staying live.
- The microphone is now released when the user ends screen sharing from the browser (for example with its "Stop sharing" button), also when it is granted only after sharing ended.
- A screen stream that ends after `stop()` no longer resets the plugin: it used to write state back after the plugin was removed, close the Dashboard panel, and, after a quick `stop()` and `start()`, drop the new session's screen stream (leaving it live) and stop its microphone.
- A microphone permission error that arrives after `stop()` no longer shows the "microphone disabled" notice.
