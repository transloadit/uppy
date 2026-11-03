---
'@uppy/companion': patch
---

Send the tus upload's final response through the websocket `success` payload as `extraData.response`, the way the multipart and xhr paths already do.
