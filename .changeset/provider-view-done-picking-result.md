---
"@uppy/core": minor
---

`ProviderView#donePicking()` and `SearchProviderView#donePicking()` (and so `done()` from `useRemoteSource`) now resolve to `true` when the selected files were added, and `false` when nothing was added (for example when the selection exceeds `maxNumberOfFiles` once folders are expanded). Use it to close your picker only on success. Subclasses overriding `donePicking()` must now return a `Promise<boolean>`.
