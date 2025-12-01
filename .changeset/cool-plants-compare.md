---
"@uppy/dashboard": patch
"@uppy/golden-retriever": patch
---

Move golden retriever clear files logic to the restore function. This prevents race condition bugs when storing state.
