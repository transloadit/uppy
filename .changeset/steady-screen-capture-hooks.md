---
"@uppy/components": patch
"@uppy/react": patch
"@uppy/screen-capture": patch
---

Fix several `useScreenCapture` lifecycle bugs.

- Mounted components now show the stopped state after `stop()`.
- Submit no longer stops the capture or calls `onSubmit` when restrictions reject the captured file. `ScreenCapture#submit()` now returns whether the file was added.
- In React, passing a new inline `onSubmit` no longer recreates `start` and `stop`, so effects that depend on them no longer restart the capture.
