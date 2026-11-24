---
"@uppy/transloadit-storage": patch
---

Prevent uploads from silently changing folders during navigation.

Hide the upload action and reject panel drops while the destination folder is loading.
Capture a destination for each accepted file, including Dashboard drops and native picker
selections. Preserve it through navigation and retries, let later batches use their own
folder, and refuse to sign one Assembly for files from different folders. Cancelling a
picker or removing queued files leaves no stale destination behind. Overlapping uploads
and retries are rejected explicitly because the integration uses one shared Assembly.

Refs #6636.
