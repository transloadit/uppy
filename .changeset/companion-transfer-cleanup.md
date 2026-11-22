---
'@uppy/companion': patch
---

Companion cleans up failed and cancelled transfers more reliably. Source streams are destroyed on every exit, and stalled downloads and uploads time out. Pausing and resuming a tus upload can no longer start it twice, and cancelling no longer deletes a tus upload Companion didn't create. URL imports ask for uncompressed responses and fail if the server compresses them anyway, instead of decompressing them. Upload requests no longer forward client method-override headers.
