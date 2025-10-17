---
"@uppy/components": patch
---

- Make `file.data` nullable - Because for ghosts it will be `undefined` and we don't have any type to distinguish ghosts from other (local) files. This caused a crash, because we didn't check for `undefined` everywhere (when trying to store a blob that was `undefined`). This means we have to add null checks in some packages
- Move `restore-confirmed` from `onUploadStart` event listener to `startUpload`, else it would cause `restore-confirmed` to be triggered even if there is no `recoveredState` to recover
