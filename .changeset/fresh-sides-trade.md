---
"@uppy/companion": patch
"@uppy/core": patch
"@uppy/aws-s3": patch
"@uppy/golden-retriever": patch
"@uppy/transloadit": patch
"@uppy/tus": patch
"@uppy/webcam": patch
---

Allow various asynchronous interfaces and callbacks to be synchronous. Some methods that never awaited anything are no longer `async`; for example `Webcam#getVideo()` now returns its value directly.
