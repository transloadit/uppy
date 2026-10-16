---
"@uppy/core": minor
"@uppy/components": minor
"@uppy/s3": minor
"@uppy/transloadit-storage": minor
"@uppy/dashboard": patch
"@uppy/locales": patch
---

**Experimental** manager mode no longer renders a selection or detail UI of its own: a file library builds those with `useS3Manager`. Removed: the item detail dialog (opened by a click on a file) and S3's `getPreviewUrl`; the "Select multiple" toggle and the bulk-actions footer, with the `selectionActive` plugin state and `ProviderView.toggleSelectionMode()`; the core strings `openFileNamed`, `itemsSelected`, `selectMultiple`, `cancelSelection`, `close`, `detailSize`, `detailType` and `detailModified`; and the `--uppy-color-secondary` theming variable. `useS3Manager` and `createS3ManagerController` no longer have `state.selectionActive` or `toggleSelectionMode()`: a headless UI keeps its own selection mode and clears the selection with `cancelSelection()`.

The `standalone` option is removed: the Dashboard shows its "Import from …" bar with Cancel, and the panel its Log out row, again. TransloaditStorage plugins that relied on `standalone` for manager mode now start in picker mode: pass `mode: 'manager'`.

In a Dashboard, manager mode lists files as plain rows: a click on a file does nothing, folders still open, and rename, move, delete and new folder stay in the item menu and the toolbar, with their dialogs and the Stop button. Bulk actions and the detail item are for headless UIs. Picker mode is unchanged.
