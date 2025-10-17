---
"@uppy/aws-s3": patch
---

- Make `file.data` nullable - Because for ghosts it will be `undefined` and we don't have any type to distinguish ghosts from other (local) files. This caused a crash, because we didn't check for `undefined` everywhere (when trying to store a blob that was `undefined`). This means we have to add null checks in some packages
- Split UppyFile into two intefaces distinguished by the `isRemote` boolean:
  - LocalUppyFile
  - RemoteUppyFile
