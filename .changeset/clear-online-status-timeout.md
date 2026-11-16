---
"@uppy/core": patch
---

Clear the initial online status check timeout in `destroy()`, so a destroyed `Uppy` instance no longer emits `is-online`/`is-offline` (or shows the offline informer) 3 seconds later and can be garbage collected right away.
