---
"@uppy/components": minor
"@uppy/react": minor
"@uppy/vue": minor
"@uppy/svelte": minor
"@uppy/core": patch
---

`useRemoteSource` accepts an `onClose` option. `cancel` clears the selection and calls `onClose`. `done` calls `onClose` after it adds the files. When restrictions or `onBeforeFileAdded` reject every selected file, the picker stays open with the selection kept. A `done` that finishes after the consumer unmounted does not call `onClose`. The hook state also updates its `error` when files are added to or removed from Uppy, and React no longer reopens the root folder when `onClose` is an inline function.

`ProviderView#donePicking()` now resolves with whether the files were added. When every selected file is rejected, the selection is kept instead of cleared. Done no longer adds files when it is aborted while it still lists folders: by cancelling the selection, closing the Dashboard panel, or cancelling all uploads.

`Thumbnail` no longer revokes the `preview` URL of remote files, which belongs to the caller.
