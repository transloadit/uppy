# @uppy/s3

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
