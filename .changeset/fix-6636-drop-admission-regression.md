---
"@uppy/transloadit-storage": patch
---

fix(transloadit-storage): reject file drops during folder navigation

Refs #6636

While a folder-listing request is in flight (`loading === true`), file drops on the Transloadit Storage panel are now rejected and a warning toast is displayed. This prevents files from being dropped into a stale folder while navigation is in progress.

