---
"@uppy/core": patch
---

Adding a checked folder from a provider now fails as a whole when one of its listings fails or is aborted (for example when the panel closes meanwhile), instead of adding the files it could list and quietly leaving out the rest. The failed listing's rejection used to go unhandled as well.
