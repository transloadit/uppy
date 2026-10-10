---
"@uppy/transloadit": patch
---

A rejected `assemblyOptions()` now fails the files and allows new uploads, as a failed Assembly creation does. Before, it left `allowNewUpload` off with no error on the files, which stranded a `retryUpload()` or `retryAll()`.

Cancelling an upload while its Assembly options were fetched no longer lets the running preprocessor create an Assembly for it. That Assembly attached to a file added again meanwhile (which has the same id) and was reused by the next upload, whatever folder that one was signed for.

The same holds for an upload cancelled while its files were reserved (`importFromUploadURLs`), without touching the Assembly of a newer upload. And a failure no longer reopens admission for new files while an upload is still preparing or running: that includes a file failing mid-batch, after which files can be added again once the batch ends rather than at the failure.
