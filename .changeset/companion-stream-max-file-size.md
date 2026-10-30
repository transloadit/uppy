---
"@uppy/companion": patch
---

Security hardening: enforce `maxFileSize` on the bytes actually streamed from the source in streaming upload mode (the default), for all upload protocols. Previously only the size declared by the provider or remote URL was checked, so a file of unknown or understated size could bypass `maxFileSize` and be streamed to the destination in full. Such uploads are now aborted with `maxFileSize exceeded` as soon as the limit is crossed.
