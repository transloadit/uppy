---
"@uppy/golden-retriever": patch
---

- **Internal inter-package breaking change:** Remove hacky internal event `restore:get-data` that would send a function as its event data (to golden retriever for it to call the function to receive data from it). Add instead `restore:plugin-data-changed` that publishes data when it changes. This means that **old versions of `@uppy/transloadit` are not compatible with newest version of `@uppy/golden-retriever` (and vice versa)**.
- Large internal refactor of Golden Retriever
- Use `state-update` handler to trigger save to local storage and blobs, instead of doing it in various other event handlers (`complete`, `upload-success`, `file-removed`, `file-editor:complete`, `file-added`). this way we don't miss any state updates. also simplifies the code a lot. this fixes:
  - Always store blob when it changes - this fixes the bug when using the compressor plugin, it would store the uncompressed original blob (like when using image editor plugin)
- Add back throttle: but throttling must happen on the actual local storage save calls inside MetaDataStore, *not* the handleStateUpdate function, so we don't miss any state updates (and end up with inconsistent data). Note that there is still a race condition where if the user removes a file (causing the blob to be deleted), then quickly reloads the page before the throttled save has happened, the file will be restored but the blob will be missing, so it will become a ghost. this is probably not a big problem though. need to disable throttling when running tests (add it as an option to the plugin)
- Fix implicit `any` types in #restore filesWithBlobs
- Don't error when saving indexedDB file that already exists (make it idempotent)
- Fix bug: Golden Retriever was not deleting from IndexedDbStore if ServiceWorkerStore exists, causing a storage leak
- Remove unused Golden Retriever cleanup.ts
- Clean up stored files on `complete` event *only* if *all* files succeeded (no failed files). this allows the user to retry failed files if they get interrupted - fixes #5927, closes #5955
- Only set `isGhost` for non-successful files - it doesn't make sense for successfully uploaded files to be ghosted because they're already done. #5930
- Add `upload-success` event handler `handleFileUploaded`: this handler will remove blobs of files that have successfully uploaded. this prevents leaking blobs when an upload with multiple files gets interrupted (but some files have uploaded successfully), because `#handleUploadComplete` (which normally does the cleanup) doesn't get called untill *all* files are complete.
- Fix `file-editor:complete` potential race condition: it would delete and add at the same time (without first awaiting delete operation)
- Fix: Don't double `setState` when restoring
- Improve types in golden retriever and MetaDataStore
- MetaDataStore: move old state expiry to from `constructor` to `load()`
