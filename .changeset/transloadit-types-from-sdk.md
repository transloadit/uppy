---
"@uppy/transloadit": minor
---

Use the `transloadit` Node.js SDK's exported Assembly types instead of our inaccurate, hand-rolled ones.

**Warning**

There is no breaking change in type exports but because the types are more strict you will get build errors if you depend on these type exports.
Since the runtime is not affected, only the types, this remains a minor release.
