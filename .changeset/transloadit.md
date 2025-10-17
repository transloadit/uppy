---
"@uppy/transloadit": patch
---

- **Internal inter-package breaking change:** Remove hacky internal event `restore:get-data` that would send a function as its event data (to golden retriever for it to call the function to receive data from it). Add instead `restore:plugin-data-changed` that publishes data when it changes. This means that **old versions of `@uppy/transloadit` are not compatible with newest version of `@uppy/golden-retriever` (and vice versa)**.
- Minor internal refactoring in order to make sure that we will always emit `restore:plugin-data-changed` whenever assembly state changes
- Split UppyFile into two intefaces distinguished by the `isRemote` boolean:
  - LocalUppyFile
  - RemoteUppyFile
