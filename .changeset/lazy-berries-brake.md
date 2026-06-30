---
"@uppy/core": patch
---

uploadRemoteFile() now queues token request and websocket request as a single job in the request queue.
