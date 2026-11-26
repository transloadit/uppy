---
'@uppy/core': patch
---

Aborting a request's signal after the request finished no longer resets its status to 0. With parallel S3 parts, a failed Companion request then reports its real status (e.g. 400) instead of 0, because the other parts' abort no longer reaches it.
