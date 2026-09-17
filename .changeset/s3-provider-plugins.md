---
"@uppy/s3": minor
"@uppy/transloadit-storage": minor
"@uppy/locales": minor
---

New `@uppy/s3` plugin: browse and manage an S3-compatible bucket from the Dashboard (rename/move, delete, new folder; `autoConnect`, `keepStateOnClose`). New `@uppy/transloadit-storage` plugin: the same browser pointed at a Transloadit Storage workspace, with a "Copy Smart CDN URL" action supplied by the application's authenticated server callback. Secrets stay on the server.

Storage uploads default to refusing collisions. Opt into renaming or overwriting explicitly, and
save the returned Workspace, asset ID, version ID and final path. The package README explains how
to use canonical stored results and version-pinned Viewer delivery without treating S3 listing
paths as immutable references.
