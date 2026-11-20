---
"@uppy/transloadit-storage": patch
---

fix(transloadit-storage): disable upload actions and drops during folder navigation

Refs #6636

While a folder-listing request is in flight (`loading === true`), the
toolbar "Upload files" button is now hidden and drag-and-drop is
rejected with a user-facing toast. This prevents a race where a user
who acted before `currentFolderId` resolved would upload files to the
_previous_ folder instead of the one they navigated to.

Additionally, the destination prefix is now pinned the moment files are
accepted (dropped or picked), so any navigation that happens while an
async signing request is in flight cannot silently retarget a queued
batch.
