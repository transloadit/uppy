---
'@uppy/core': patch
---

Fix a retried file being reported as successful by its original upload while the retry was still running. Retrying a file now moves it out of any upload that is still running, so only the retry reports it.
