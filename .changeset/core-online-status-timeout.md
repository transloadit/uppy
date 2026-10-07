---
'@uppy/core': patch
---

Cancel the pending initial online-status check when destroying an Uppy instance,
preventing callbacks after destruction and errors after test-environment teardown.
