---
"@uppy/aws-s3": patch
"@uppy/companion-client": patch
"@uppy/compressor": patch
"@uppy/core": patch
"@uppy/dashboard": patch
"@uppy/golden-retriever": patch
"@uppy/image-editor": patch
"@uppy/provider-views": patch
"@uppy/status-bar": patch
"@uppy/thumbnail-generator": patch
"@uppy/transloadit": patch
"@uppy/tus": patch
"@uppy/url": patch
"@uppy/utils": patch
---

- Large internal refactor of Golden Retriever
- Fix bug: Golden Retriever was not deleting from IndexedDbStore if ServiceWorkerStore exists, causing a storage leak
- Remove `restore-canceled` event as it was not being used.
- Throw a proper `Nonexistent upload` error message if trying to upload a non-existent upload, instead of TypeError
- Rewrite `Uppy.upload()` - this fixes two bugs:
  1. No more duplicate emit call when this.#restricter.validateMinNumberOfFiles throws (`#informAndEmit` and `this.emit('error')`)
  2. 'restriction-failed' now also gets correctly called when `checkRequiredMetaFields` check errors.
- Remove unused Golden Retriever cleanup.ts
- Clean up stored files on `complete` event *only* if *all* files succeeded (no failed files). this allows the user to retry failed files if they get interrupted - fixes #5927, closes #5955
- Only set `isGhost` for non-successful files - it doesn't make sense for successfully uploaded files to be ghosted because they're already done. #5930
- add `upload-success` event handler `handleFileUploaded`: this handler will remove blobs of files that have successfully uploaded. this prevents leaking blobs when an upload with multiple files gets interrupted (but some files have uploaded successfully), because `#handleUploadComplete` (which normally does the cleanup) doesn't get called untill *all* files are complete.
- fix `file-editor:complete` potential race condition: it would delete and add at the same time (without first awaiting delete operation)
- don't double `setState` when restoring
- Improve types in golden retriever and MetaDataStore
- MetaDataStore: move old state expiry to from `constructor` to `load()`
- Don't re-upload completed files #5930
- Split UppyFile into two intefaces distinguished by the `isRemote` boolean:
  - LocalUppyFile
  - RemoteUppyFile
- Remove TagFile type - Use UppyFile instead.
- Rename `getTagFile` to `companionFileToUppyFile`
- Make `name` required on UppyFile (it is in reality always set)
- Fix bug: `RestrictionError` sometimes thrown with a `file` property that was *not* a `UppyFile`, but a `File`. This would happen if someone passed a `File` instead of a `MinimalRequiredUppyFile` into `core.addFile` (which is valid to do according to our API)
- Improve some log messages
