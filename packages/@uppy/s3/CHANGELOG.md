# @uppy/s3

## 0.2.1

### Patch Changes

- f58058d: Only access `localStorage` when a provider plugin's default token storage is used, so the plugins can be constructed during server-side rendering again.

## 0.2.0

### Minor Changes

- 54d543c: **Experimental** manager mode is now headless: a file library renders it with `useS3Manager`. In manager mode the plugin no longer mounts into the Dashboard (no tab, no file drops, no `reopenAfterUpload` panel), and closing a Dashboard panel no longer resets its state or aborts its requests. `useS3Manager` warns when given a plugin in picker mode. Removed: the item detail dialog (opened by a click on a file) and S3's `getPreviewUrl`; the "Select multiple" toggle and the bulk-actions footer, with the `selectionActive` plugin state and `ProviderView.toggleSelectionMode()`; the core strings `openFileNamed`, `itemsSelected`, `selectMultiple`, `cancelSelection`, `close`, `detailSize`, `detailType` and `detailModified`; and the `--uppy-color-secondary` theming variable. `useS3Manager` and `createS3ManagerController` no longer have `state.selectionActive` or `toggleSelectionMode()`: a headless UI keeps its own selection mode and clears the selection with `cancelSelection()`.

  The `standalone` option is removed: the Dashboard shows its "Import from …" bar with Cancel, and the panel its Log out row, again. TransloaditStorage plugins that relied on `standalone` for manager mode now start in picker mode: pass `mode: 'manager'`.

  With the panel gone, so is what only it needed: the progress screen's Stop button (and the `stopOperation` string), and the busy state that disabled the header, filter and breadcrumbs during a long operation. Long operations, their progress text and `cancelLongOperation()` remain for `useS3Manager`. Picker mode is unchanged, including the item menu, toolbar actions and dialogs that Transloadit Storage's picker actions use.

  If an app runs manager mode inside a Dashboard with `@uppy/s3` 0.1.x or `@uppy/transloadit-storage` 0.1.x, the panel will be empty once its `^6.2.0` range picks up `@uppy/core` 6.3. Those plugins stay on 0.1.x, because a caret range on a 0.x version doesn't cross minors. Nothing throws. Render manager mode with `useS3Manager`, or keep `@uppy/core` on 6.2 until then. Picker mode is unaffected.

### Patch Changes

- 0020b70: A folder move or delete stops handing out files after the first failure and waits for the files already in flight before it fails, instead of reporting the failure while its other workers keep going.
- 78970b1: Add a README, so the npm page is no longer empty.

## 0.1.1

### Patch Changes

- 3f1aca3: Stricter TypeScript: caught errors are typed as `unknown`, and `noImplicitOverride` and `noImplicitReturns` are enabled for all packages.
  - `@uppy/core/utils`: add `toError`, `getErrorMessage`, `isAbortError` and `isRestrictionError` helpers. `@uppy/core/companion-client`: export `isAuthError`.
  - `@uppy/webcam`: `icon` is now public, like on other acquirer plugins. `start()` now returns a promise that settles once the camera is ready, instead of `undefined`.
  - `@uppy/url`: `handleRootDrop` and `handleRootPaste` are now public, as Dashboard and DropTarget call them. The failed-fetch notification's `details` is now the error message instead of the Error object.

## 0.1.0

### Minor Changes

- 480e44c: **Experimental:** both plugins, and the Companion endpoints they use, will change incompatibly
  (also in minor releases) as they make way for a standalone file manager. Both log a warning when
  installed.

  New `@uppy/s3` plugin: browse an S3-compatible bucket from the Dashboard and pick files from it (`autoConnect`, `keepStateOnClose`), or, with `mode: 'manager'`, manage it: rename/move, delete, new folder, bulk move/delete. Picker mode never changes existing files. What the user may see and change comes from Companion, either from the bucket it is configured with or from the storage grant your server issued. Moving a folder runs item by item from the client, so progress is visible and a failure stops at a known point. New `@uppy/transloadit-storage` plugin: the same browser pointed at a Transloadit Storage workspace, with a "Copy Smart CDN URL" action supplied by the application's authenticated server callback. Secrets stay on the server.

  Storage uploads default to refusing collisions. Opt into renaming or overwriting explicitly, and
  save the returned Workspace, asset ID, version ID and final path. The package README explains how
  to use canonical stored results and version-pinned Viewer delivery without treating S3 listing
  paths as immutable references.
