---
"@uppy/webcam": patch
---

- Remove TagFile type - Use UppyFile instead.
- Split UppyFile into two interfaces distinguished by the `isRemote` boolean:
  - LocalUppyFile
  - RemoteUppyFile
