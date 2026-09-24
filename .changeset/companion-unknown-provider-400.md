---
'@uppy/companion': patch
---

Requests naming an unknown provider (for example `/nonexistent/list/`, or `/instagram/list/` now that Instagram is gone) are answered with a 400 again instead of being left without a response. The provider middleware stopped calling `next()` on that path in the TypeScript port, so such requests hung until the client gave up.
