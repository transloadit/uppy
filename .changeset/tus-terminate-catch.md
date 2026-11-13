---
"@uppy/tus": patch
---

Catch the best-effort terminate (`abort(true)`) rejection when aborting an uploader, so terminating an already-finished upload logs a warning instead of surfacing as an unhandled promise rejection.
