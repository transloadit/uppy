---
'@uppy/core': patch
---

`fetcher` now folds header names that differ only in case into one entry (last
one wins) instead of letting `XMLHttpRequest` combine their values.
