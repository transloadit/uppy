# @uppy/s3

## 0.2.2

### Patch Changes

- c52f0c2: Say when connecting to a provider fails, and let it be retried.
  
  - A failed login now shows the connect screen again, so the user can retry. Before, when S3 auto-connected and Companion could not be reached, the plugin showed an empty folder with no way to connect.
  - S3 and Transloadit Storage: a `getGrant()` that rejects now shows "Connection with Companion failed", like a failed request, instead of only being logged. Its message is not shown; a `UserFacingApiError` it throws is still shown as is.
  - An OAuth login that cannot reach Companion for its pre-auth token (with `companionKeysParams`) now shows "Connection with Companion failed" instead of only being logged.
  - An OAuth login that fails for any reason other than the user closing the login window (the callback socket closes, Companion reports an error, no token comes back) now shows "Connection with Companion failed" instead of "Authentication aborted".
- 2a383b6: Fix two provider search bugs and an ordering bug in provider folders.
  
  - A search result whose path has no segments (such as `/`) no longer crashes the Dashboard with "Partial tree not complete".
  - Search results that share a path (older Companion versions sent `undefined` for some Dropbox items) are now listed as one entry instead of repeating the first one.
  - A file or folder that a search or an S3 deep link added to a folder before that folder listed it now stays below the loaded items while you scroll, until the page that contains it loads, instead of sitting between the first and second page.
- 1430c20: When a listing reports a different bucket than the one before it (a renewed grant for another bucket, or a reconnect, without logging out), the plugin now starts over at the root: the loaded folders and the selection are dropped and the user is told to select the files again. Before, files and folders selected in the first bucket could be imported, or expanded, from the second one, where the same key can be another file.
- 4c7fed6: S3: opening a granted deep folder such as `tenant/photos/2026/` now lists only that folder instead of the root and every folder above it. Empty or missing folders are still checked against their parent's listing, so a stale link still stops at the nearest existing folder. A path outside the grant shows the root.
  
  Remote providers: a folder that was added to the tree before its parent was listed (for its breadcrumbs or as a search result) now appears in the parent's listing order once the parent is opened, and no longer appears twice when it is on a later page.
- 060ebf8: Transloadit Storage: uploads no longer land in the folder the user just left. Toolbar actions (such as "Upload files" and "New folder") are disabled while a folder is still listing, and with `storeUploads` the panel takes no dropped files then. Queued files are stored in the folder they were added in, even if the panel shows another folder by the time they upload; the panel takes no new files in another folder until those are uploaded or removed.
  
  Failed storage or encoding attempts keep their destination when retried. Files queued before connecting no longer prevent later files from being pinned to their folder.
  
  Manually configured `createStoreAssemblyOptions` pipelines use the same folder-dependent drop guards as `storeUploads`.
  
  The destination is reserved when a drop is accepted, so navigating while Dashboard reads dropped files or folders cannot redirect them.
  
  Uploads added before connecting reserve their first signed destination for retries. Files added outside the panel during navigation bind to the folder once its listing settles.
  
  Multi-folder navigation is treated as one operation. Local selections and picker imports reserve their folder before the panel can reset, and all panel upload actions honor an existing queue’s destination.
  
  Toolbar actions also wait during paginated path navigation. Dismissing a file picker without a cancel event no longer leaves a folder reservation behind.
  
  Empty or rejected additions do not bind a previously unbound queue; provisional reservations are kept only after adding files or preparing an Assembly signature.
  
  Picker imports reserve their destination before reading selected directories. Headless managers report navigation as busy. Assembly-option failures remain retryable, and empty upload completions do not clear queued files.
  
  Successful uploads invalidate cached destination listings even when the panel has moved to another folder.
  
  Queued destinations reset on logout or a change of bucket or grant prefix. Signing never reuses a destination outside the current session’s root.
  
  Automatic reopening preserves failed files from earlier batches and files added before the deferred cleanup runs.
  
  Refreshing the uploaded destination preserves selections in unrelated folders.
  
  Refilling an invalidated checked folder reuses cached child IDs and lists each child folder once, preventing duplicate imports and incorrect file-count restrictions.

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
