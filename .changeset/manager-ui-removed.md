---
"@uppy/core": minor
"@uppy/components": minor
"@uppy/s3": minor
"@uppy/transloadit-storage": minor
"@uppy/dashboard": patch
"@uppy/locales": patch
---

**Experimental** manager mode is now headless: the Dashboard panel renders nothing in it (and logs a warning) and no longer connects or lists, and a file library renders it with `useS3Manager`. Removed: the item detail dialog (opened by a click on a file) and S3's `getPreviewUrl`; the "Select multiple" toggle and the bulk-actions footer, with the `selectionActive` plugin state and `ProviderView.toggleSelectionMode()`; the core strings `openFileNamed`, `itemsSelected`, `selectMultiple`, `cancelSelection`, `close`, `detailSize`, `detailType` and `detailModified`; and the `--uppy-color-secondary` theming variable. `useS3Manager` and `createS3ManagerController` no longer have `state.selectionActive` or `toggleSelectionMode()`: a headless UI keeps its own selection mode and clears the selection with `cancelSelection()`.

The `standalone` option is removed: the Dashboard shows its "Import from …" bar with Cancel, and the panel its Log out row, again. TransloaditStorage plugins that relied on `standalone` for manager mode now start in picker mode: pass `mode: 'manager'`.

With the panel gone, so is what only it needed: the progress screen's Stop button (and the `stopOperation` string), and the busy state that disabled the header, filter and breadcrumbs during a long operation. Long operations, their progress text and `cancelLongOperation()` remain for `useS3Manager`. Picker mode is unchanged, including the item menu, toolbar actions and dialogs that Transloadit Storage's picker actions use.
