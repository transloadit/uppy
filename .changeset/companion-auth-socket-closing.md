---
'@uppy/companion': patch
---

Keep the login result when the login socket closes while Companion is still subscribing to it, instead of consuming the result and failing to send it.
