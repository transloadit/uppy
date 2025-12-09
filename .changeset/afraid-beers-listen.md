---
"@uppy/utils": patch
"@uppy/xhr-upload": patch
---

Fix `complete` event never firing for XHR and make sure the fetch aborts immediately if Uppy is cancelled before the fetch starts.
