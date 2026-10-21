---
'@uppy/companion': patch
---

Security: the WebSocket routes now accept only UUID tokens, so a client can no longer subscribe to reserved emitter events or Redis patterns and receive other users' auth tokens or upload events. Upload error frames now carry only the error's `name` and `message`, and for a failed multipart upload the destination's answer in `extraData` (status, status text, body and headers), instead of the serialised error, which could include other users' request headers. Connection logs no longer print full tokens.
