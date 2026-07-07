---
"@uppy/tus": patch
---

Catch the best-effort terminate (`abort(true)`) rejection in `resetUploaderReferences` so terminating an already-finished upload no longer surfaces as an unhandled promise rejection.
