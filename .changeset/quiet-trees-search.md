---
"@uppy/core": patch
---

Provider views: no longer crash with `Partial tree not complete` when a server-side search returns an item whose `requestPath` is not a path, such as a Dropbox shared item that isn't mounted (Dropbox returns no `path_lower` for it). Such results are now skipped, and search results missing from the partial tree are no longer a fatal render error.
