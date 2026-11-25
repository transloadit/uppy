---
"@uppy/core": patch
---

Replace the `namespace-emitter` dependency with an equivalent event emitter inside `@uppy/core`. `on`, `once`, `off` and `emit` work as before, including `on('*')` and namespace listeners (a `dashboard` listener also receives `dashboard:modal-closed`), with four fixes: `off(event, fn)` now also removes a listener added with `once(event, fn)`; `*` listeners receive namespaced events regardless of the order in which listeners were added; `emit('*')` calls `*` listeners once instead of twice; and names such as `constructor` can be used as event names.
