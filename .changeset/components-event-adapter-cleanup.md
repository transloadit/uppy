---
"@uppy/components": patch
---

Fix a listener leak in `createUppyEventAdapter`: the `file-removed` event was
subscribed but never unsubscribed in `cleanup()`, so framework wrappers
(React, Vue, Svelte) leaked a `file-removed` handler every time a component
using the adapter was unmounted.
