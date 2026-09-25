---
'@uppy/companion': patch
---

Ignore an empty (or whitespace-only) `transloadit_gateway` in fetched provider credentials again. Since 7.0.0 an empty string was passed to `new URL()`, which threw `Invalid URL` and turned every OAuth login using such credentials into a "Could not fetch credentials" page.
