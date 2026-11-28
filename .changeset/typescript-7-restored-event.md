---
'@uppy/core': patch
---

Fix a type error with `@uppy/transloadit`: its narrower `restored` event type conflicted with the one in `@uppy/core`. TypeScript 7 always reports it, and TypeScript 6 does when `skipLibCheck` is off.
