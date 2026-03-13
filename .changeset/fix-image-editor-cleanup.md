---
"@uppy/image-editor": patch
---

Fix cropper not reinitializing after save/cancel by destroying previous instance in `start()` and cleaning up on file removal
