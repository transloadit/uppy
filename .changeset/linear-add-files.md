---
"@uppy/core": patch
---

Make `addFiles()` linear instead of quadratic in the number of files. Adding 16k files took ~12s and now takes ~0.1s.
