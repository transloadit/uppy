---
"@uppy/xhr-upload": minor
---

The `endpoint` option now also accepts a callback to dynamically set it (`endpoint: (fileOrFiles) => '<url>'`).
If `bundle` is `true`, you get `UppyFile[]` otherwise `UppyFile`.
