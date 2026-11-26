---
"@uppy/transloadit-storage": patch
"@uppy/core": patch
"@uppy/dashboard": patch
"@uppy/locales": patch
"@uppy/s3": patch
---

Transloadit Storage: uploads no longer land in the folder the user just left. Toolbar actions (such as "Upload files" and "New folder") are disabled while a folder is still listing, and with `storeUploads` the panel takes no dropped files then. Queued files are stored in the folder they were added in, even if the panel shows another folder by the time they upload; the panel takes no new files in another folder until those are uploaded or removed.

Failed storage or encoding attempts keep their destination when retried. Files queued before connecting no longer prevent later files from being pinned to their folder.

Manually configured `createStoreAssemblyOptions` pipelines use the same folder-dependent drop guards as `storeUploads`.

The destination is reserved when a drop is accepted, so navigating while Dashboard reads dropped files or folders cannot redirect them.

Uploads added before connecting reserve their first signed destination for retries. Files added outside the panel during navigation bind to the folder once its listing settles.

Multi-folder navigation is treated as one operation. Local selections and picker imports reserve their folder before the panel can reset, and all panel upload actions honor an existing queue’s destination.

Toolbar actions also wait during paginated path navigation. Dismissing a file picker without a cancel event no longer leaves a folder reservation behind.

Empty or rejected additions do not bind a previously unbound queue; provisional reservations are kept only after adding files or preparing an Assembly signature.
