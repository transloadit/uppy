---
"@uppy/core": minor
---

**Experimental** (marked `@experimental` in the types): the file-management additions below exist
for `@uppy/s3` and will change incompatibly, also in minor releases.

ProviderViews can now show per-item actions (`actions`, rendered as a "⋯" menu) and header `toolbarActions`, refresh the open folder with `refreshCurrentFolder()`, and ask the user for input with inline `prompt()` / `confirm()` dialogs. A new `mode: 'manager'` (a file library: clicking opens an item's details, multi-select behind a toggle, the selection feeds `bulkActions`) is a stopgap until a dedicated file manager plugin; `bulkActions` only exist there. The Companion client gained `deleteItem()`, `moveItem()` and `createFolder()` for providers that support mutations.
