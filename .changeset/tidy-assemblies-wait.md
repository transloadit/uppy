---
"@uppy/transloadit": patch
---

A rejected `assemblyOptions()` now fails the files and allows new uploads, as a failed Assembly creation does. Before, it left `allowNewUpload` off with no error on the files, which stranded a `retryUpload()` or `retryAll()`.

Cancelling an upload while its Assembly options were fetched no longer lets the running preprocessor create an Assembly for it. That Assembly attached to a file added again meanwhile (which has the same id) and was reused by the next upload, whatever folder that one was signed for.
