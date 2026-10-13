---
"@uppy/core": minor
"@uppy/s3": minor
"@uppy/transloadit-storage": minor
"@uppy/components": minor
"@uppy/react": minor
"@uppy/dashboard": patch
"@uppy/locales": patch
---

**Experimental** manager mode no longer has its own UI inside the Dashboard: a file library renders its own with `useS3Manager`. Removed: the item detail dialog and S3's `getPreviewUrl`; the "Select multiple" toggle and the bulk-actions footer, with the `selectionActive` plugin state, `ProviderView.toggleSelectionMode()` and `useS3Manager`'s `selectionActive`/`toggleSelectionMode`; the `standalone` option; and the `--uppy-color-secondary` theming variable. TransloaditStorage no longer turns on manager mode for `standalone`: pass `mode: 'manager'`.

In a Dashboard, manager mode now lists files without checkboxes. Renaming, moving, deleting and new folders stay in the item menu and the toolbar, and bulk actions, the detail item and dialogs stay available to headless UIs. Picker mode is unchanged.
