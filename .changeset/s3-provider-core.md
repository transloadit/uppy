---
"@uppy/core": minor
---

**Experimental** (marked `@experimental` in the types): the file-management additions below exist
for `@uppy/s3` and will change incompatibly, also in minor releases.

ProviderViews can now show per-item actions (`actions`, rendered as a "⋯" menu) and header `toolbarActions`, refresh the open folder with `refreshCurrentFolder()`, and ask the user for input with inline `prompt()` / `confirm()` dialogs. The Companion client gained `deleteItem()`, `moveItem()` and `createFolder()` for providers that support mutations.
