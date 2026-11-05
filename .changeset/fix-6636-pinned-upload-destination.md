---
"@uppy/transloadit-storage": patch
---

fix(transloadit-storage): pin upload destination at acceptance time

Refs #6636

The upload destination prefix is now pinned the moment files are accepted (dropped or picked), so any folder navigation that happens while an async signing request is in flight cannot silently retarget a queued batch. The pin is automatically reset when the queue is emptied or the upload completes.
