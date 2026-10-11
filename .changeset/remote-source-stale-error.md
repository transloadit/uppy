---
"@uppy/components": patch
---

`useRemoteSource` (React, Vue, Svelte): `state.error` now updates when files are added or removed, or when restrictions change via `uppy.setOptions()`. Previously it only refreshed on the next plugin state change. The hook also no longer notifies (and re-renders Svelte consumers) for state updates that don't change its snapshot.
