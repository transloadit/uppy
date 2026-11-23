---
"@uppy/transloadit-storage": patch
"@uppy/core": patch
"@uppy/locales": patch
---

Transloadit Storage: uploads no longer land in the folder the user just left. Toolbar actions (such as "Upload files" and "New folder") are disabled while a folder is still listing, and with `storeUploads` the panel takes no dropped files then. Queued files are stored in the folder they were added in, even if the panel shows another folder by the time they upload; the panel takes no new files in another folder until those are uploaded or removed.
