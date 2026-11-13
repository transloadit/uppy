---
"@uppy/components": patch
"@uppy/react": patch
"@uppy/webcam": patch
---

Fix several `useWebcam` lifecycle bugs.

- Mounted components now show the stopped state after `stop()`.
- The snapshot and record buttons respect the Webcam `modes` option, and record is disabled when the browser has no `MediaRecorder`. The live preview respects `mirror: false`.
- Submit no longer stops the camera or calls `onSubmit` when restrictions reject the captured file. `Webcam#submit()` now returns whether the file was added.
- In React, passing a new inline `onSubmit` no longer recreates `start` and `stop`, so effects that depend on them no longer restart the camera.
- A snapshot can be retried after `onBeforeSnapshot` rejects.
- Closing the camera while it is starting no longer leaves it on. `Webcam#stop()` cancels pending `start()` calls, and a stream that arrives later is stopped.
- Switching cameras in the Dashboard no longer passes through a stopped state.
