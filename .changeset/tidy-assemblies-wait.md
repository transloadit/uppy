---
"@uppy/transloadit": patch
---

A rejected `assemblyOptions()` now fails the files and allows new uploads, as a failed Assembly creation does. Before, it left `allowNewUpload` off with no error on the files, which stranded a `retryUpload()` or `retryAll()`. When such a retry fails while another upload is running, or an upload fails while a retry is running, the running one keeps its Assembly.

An upload cancelled while its Assembly options are fetched, its Assembly is created or announced, or its files are reserved (`importFromUploadURLs`, also when the reservation then fails) no longer leaves an Assembly behind: it is cancelled on the server, so a file added again meanwhile (it has the same id) cannot attach to it and the next upload cannot reuse it with the cancelled one's options or signature. Removing every file of an upload while it is prepared now ends that upload quietly; before, `upload()` rejected with "All files were canceled after assembly was created".

After `cancelAll()`, an upload started before the cancel request returns gets its own Assembly instead of the one being cancelled, and a late result or error of the cancelled one no longer closes the newer upload's Assembly. Cancelling an upload without files (a Template that imports its own inputs) is detected as well, and it no longer holds new files back or touches a newer upload's Assembly when its signing settles later.

A failure no longer allows new files while another upload is still preparing or running, and two attempts failing at once no longer keep each other from allowing them. That includes a file failing mid-batch: files can be added again once its batch ends, not at the failure.
