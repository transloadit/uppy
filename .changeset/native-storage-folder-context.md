---
"@uppy/companion": patch
"@uppy/s3": patch
---

Forward grant-bound native Storage folder context through Companion, require broker session tokens, and verify acknowledgement before storing browser sessions. Isolate context credentials while sharing finite Workspace socket pools, and cache clients only after successful credential resolution. Native catalog moves include context tokens only for context sessions.
