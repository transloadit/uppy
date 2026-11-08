---
"@uppy/core": patch
---

Replace the `namespace-emitter` dependency with an equivalent event emitter inside `@uppy/core`. `on`, `once`, `off` and `emit` behave as before, including `on('*')` and namespaced events such as `upload-success:foo`.
