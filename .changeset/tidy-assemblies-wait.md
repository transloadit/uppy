---
"@uppy/transloadit": patch
---

Each upload now keeps track of the Assembly it is using, and lets go of it however it ends. Before, every error, cancel and failed preparation acted on the one live Assembly, whichever upload it belonged to.

A rejected `assemblyOptions()` now fails the files and allows new uploads, as a failed Assembly creation does. Before, it left `allowNewUpload` off with no error on the files, which stranded a `retryUpload()` or `retryAll()`. When such a retry fails while another upload is running, or an upload fails while a retry is running, the running one keeps its Assembly. So does a batch waiting for its encoding or metadata when another `upload()` is refused meanwhile ("Cannot create a new upload: already uploading."); before, that error closed its Assembly and left the batch waiting forever, with no new uploads allowed. An `error` event no longer closes any Assembly by itself: a file's failure closes the Assembly that file is in.

A retry started while another upload is running gets its own Assembly. Before, it was added to the running upload's, which was then connected a second time and closed when the retry ended.

An upload cancelled while its Assembly options are fetched, its Assembly is created or announced, or its files are reserved (`importFromUploadURLs`, also when the reservation then fails) no longer leaves an Assembly behind: it is cancelled on the server, so a file added again meanwhile (it has the same id) cannot attach to it and the next upload cannot reuse it with the cancelled one's options or signature. Removing every file of an upload while it is prepared now ends that upload quietly; before, `upload()` rejected with "All files were canceled after assembly was created". An upload dropped by core without ending (a retry whose uploader rejects before reporting its files, or whose last file is removed while an earlier file remains) lets go of its Assembly too, so the next upload creates its own.

After `cancelAll()`, an upload started before the cancel request returns gets its own Assembly instead of the one being cancelled, and a late result or error of the cancelled one no longer closes the newer upload's Assembly. The cancelled Assembly stops polling, and an upload waiting for its encoding or metadata ends instead of waiting forever. Cancelling an upload without files (a Template that imports its own inputs) is detected as well, and it no longer holds new files back or touches a newer upload's Assembly when its signing settles later.

A failure no longer allows new files while another upload is still preparing or running, and two attempts failing at once no longer keep each other from allowing them. That includes a file failing mid-batch: files can be added again once its batch ends, not at the failure. With `importFromUploadURLs`, a file uploaded after another file of its batch failed no longer throws from the `upload-success` handler.

With `waitForEncoding` or `waitForMetadata`, an Assembly that finishes but whose final status cannot be fetched now fails its files, instead of the upload waiting forever with an unhandled rejection.

With Golden Retriever, a restored Assembly whose file reservation is rejected is let go of, so a retry creates a fresh Assembly instead of failing with it again; and restored files now get the encoding progress of their Assembly (it was reported on Transloadit's upload ids instead of theirs). Uninstalling the plugin now also stops its `upload-error` and `restored` handling.
