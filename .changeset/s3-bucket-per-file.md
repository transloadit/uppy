---
"@uppy/s3": patch
"@uppy/locales": patch
---

When a listing reports a different bucket than the one before it (a renewed grant for another bucket, or a reconnect, without logging out), the plugin now starts over at the root: the loaded folders and the selection are dropped and the user is told to select the files again. Before, files and folders selected in the first bucket could be imported, or expanded, from the second one, where the same key can be another file.
