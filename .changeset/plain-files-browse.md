---
"@uppy/components": minor
"@uppy/react": minor
"@uppy/core": patch
---

Add an experimental `useS3Manager` hook and `createS3ManagerController` for `@uppy/s3` (and `@uppy/transloadit-storage`) in manager mode, so apps can render their own file manager instead of the ProviderView UI. ProviderView now exposes `submitDialog`, `cancelDialog`, `cancelLongOperation`, `canCancelOperation` and `getDetailItem` for headless UIs, and `toggleCheckbox` takes the rows in the order the UI shows them for shift-click ranges. A range can span folders: each folder's checked state is recomputed.

The hook and the controller are experimental: they can change incompatibly in a minor release of `@uppy/react` or `@uppy/components`. Pin them with `~` if you depend on them.

In manager mode, selecting every loaded item of a folder no longer marks the folder as fully selected while it has more pages, so the next page doesn't come in selected and a bulk action can't reach files nobody saw.
