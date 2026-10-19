# @uppy/components

## 2.1.0

### Minor Changes

- 54d543c: **Experimental** manager mode is now headless: a file library renders it with `useS3Manager`. In manager mode the plugin no longer mounts into the Dashboard (no tab, no file drops, no `reopenAfterUpload` panel), and closing a Dashboard panel no longer resets its state or aborts its requests. `useS3Manager` warns when given a plugin in picker mode. Removed: the item detail dialog (opened by a click on a file) and S3's `getPreviewUrl`; the "Select multiple" toggle and the bulk-actions footer, with the `selectionActive` plugin state and `ProviderView.toggleSelectionMode()`; the core strings `openFileNamed`, `itemsSelected`, `selectMultiple`, `cancelSelection`, `close`, `detailSize`, `detailType` and `detailModified`; and the `--uppy-color-secondary` theming variable. `useS3Manager` and `createS3ManagerController` no longer have `state.selectionActive` or `toggleSelectionMode()`: a headless UI keeps its own selection mode and clears the selection with `cancelSelection()`.
  
  The `standalone` option is removed: the Dashboard shows its "Import from …" bar with Cancel, and the panel its Log out row, again. TransloaditStorage plugins that relied on `standalone` for manager mode now start in picker mode: pass `mode: 'manager'`.
  
  With the panel gone, so is what only it needed: the progress screen's Stop button (and the `stopOperation` string), and the busy state that disabled the header, filter and breadcrumbs during a long operation. Long operations, their progress text and `cancelLongOperation()` remain for `useS3Manager`. Picker mode is unchanged, including the item menu, toolbar actions and dialogs that Transloadit Storage's picker actions use.
  
  If an app runs manager mode inside a Dashboard with `@uppy/s3` 0.1.x or `@uppy/transloadit-storage` 0.1.x, the panel will be empty once its `^6.2.0` range picks up `@uppy/core` 6.3. Those plugins stay on 0.1.x, because a caret range on a 0.x version doesn't cross minors. Nothing throws. Render manager mode with `useS3Manager`, or keep `@uppy/core` on 6.2 until then. Picker mode is unaffected.
- a7a7997: Add an experimental `useS3Manager` hook and `createS3ManagerController` for `@uppy/s3` (and `@uppy/transloadit-storage`) in manager mode, so apps can render their own file manager instead of the ProviderView UI. ProviderView now exposes `submitDialog`, `cancelDialog`, `cancelLongOperation`, `canCancelOperation` and `getDetailItem` for headless UIs, and `toggleCheckbox` takes the rows in the order the UI shows them for shift-click ranges. A range can span folders: each folder's checked state is recomputed.
  
  The hook and the controller are experimental: they can change incompatibly in a minor release of `@uppy/react` or `@uppy/components`. Pin them with `~` if you depend on them.
  
  In manager mode, selecting every loaded item of a folder no longer marks the folder as fully selected while it has more pages, so the next page doesn't come in selected and a bulk action can't reach files nobody saw.

### Patch Changes

- 715eb80: Move the source map of the minified CSS into a separate file. The `.min.css` files, and `image-editor.css` in `@uppy/components`, `@uppy/react`, `@uppy/vue` and `@uppy/svelte`, embedded it inline and were larger than the unminified CSS. They now link to an external `.css.map` instead, at about half the gzipped size.
- 78970b1: Add a README, so the npm page is no longer empty.

## 2.0.0

### Major Changes

- 12de077: Remove @uppy/instagram references from all the packages

### Minor Changes

- 84ad853: Import Preact from @uppy/core utilities to guarantee a single version across packages.

### Patch Changes

- 675697d: Add `useGooglePicker` react hook and remove unused `RequestClient` options `name`, `pluginId` and `provider`.
- 2608037: Fix a listener leak in `createUppyEventAdapter`: the `file-removed` event was
  subscribed but never unsubscribed in `cleanup()`, so framework wrappers
  (React, Vue, Svelte) leaked a `file-removed` handler every time a component
  using the adapter was unmounted.
- c3c7cef: Bump shared runtime dependencies (preact, nanoid, lodash, classnames, shallow-equal, pretty-bytes, p-queue, tus-js-client, @transloadit/types @transloadit/prettier-bytes v1, is-mobile, exifr, compressorjs, rxjs, tslib). Also includes type-only fixes in `@uppy/companion`'s `jwt.ts` and `request.ts` to track `@types/jsonwebtoken` v9 and `@types/node`.
- Updated dependencies [675697d]
- Updated dependencies [7e8e04f]
- Updated dependencies [c3c7cef]
- Updated dependencies [ddffd2c]
- Updated dependencies [2608032]
- Updated dependencies [2608031]
- Updated dependencies [260804f]
- Updated dependencies [7ac2623]
- Updated dependencies [ad4050b]
- Updated dependencies [4a0e6c9]
- Updated dependencies [84ad853]
- Updated dependencies [1a1aef3]
  - @uppy/core@6.0.0
  - @uppy/google-photos-picker@2.0.0
  - @uppy/google-drive-picker@2.0.0
  - @uppy/screen-capture@6.0.0
  - @uppy/image-editor@5.0.0
  - @uppy/webcam@6.0.0

## 1.2.0

### Minor Changes

- 37f69d0: Introduce `useImageEditor` to build your own UI for using our image editor in React, Vue, and Svelte.

### Patch Changes

- 37f69d0: - Fix Vue components to work with kebab-case props (`:edit-file` instead of `:editFile`)
- Updated dependencies [37f69d0]
  - @uppy/image-editor@4.2.0

## 1.1.0

### Minor Changes

- 72d2d68: Add @uppy/{screen-capture,status-bar,webcam} as optional peer dependencies

### Patch Changes

- 26bf726: Dropzone and FileInput inherit restrictions from @uppy/core

## 1.0.4

### Patch Changes

- 0c16fe4: - Make `file.data` nullable - Because for ghosts it will be `undefined` and we don't have any type to distinguish ghosts from other (local) files. This caused a crash, because we didn't check for `undefined` everywhere (when trying to store a blob that was `undefined`). This means we have to add null checks in some packages
  - Move `restore-confirmed` from `onUploadStart` event listener to `startUpload`, else it would cause `restore-confirmed` to be triggered even if there is no `recoveredState` to recover
- Updated dependencies [0c16fe4]
- Updated dependencies [0c16fe4]
  - @uppy/core@5.1.1
  - @uppy/image-editor@4.0.2

## 1.0.3

### Patch Changes

- 34639ba: add imageThumbnail prop to FilesList/FilesGrid

## 1.0.2

### Patch Changes

- 975317d: Removed "main" from package.json, since export maps serve as the contract for the public API.
- Updated dependencies [4b6a76c]
- Updated dependencies [975317d]
  - @uppy/core@5.0.2
  - @uppy/audio@3.0.1
  - @uppy/image-editor@4.0.1
  - @uppy/remote-sources@3.0.1
  - @uppy/screen-capture@5.0.1
  - @uppy/webcam@5.0.1

## 1.0.1

### Patch Changes

- 49522ec: Remove preact/compat imports in favor of preact, preventing JSX type issues in certain setups.
- Updated dependencies [49522ec]
  - @uppy/core@5.0.1

## 1.0.0

### Major Changes

- c5b51f6: ### Export maps for all packages

  All packages now have export maps. This is a breaking change in two cases:

  1. The css imports have changed from `@uppy[package]/dist/styles.min.css` to `@uppy[package]/css/styles.min.css`
  2. You were importing something that wasn't exported from the root, for instance `@uppy/core/lib/foo.js`. You can now only import things we explicitly exported.

  #### Changed imports for `@uppy/react`, `@uppy/vue`, and `@uppy/svelte`

  Some components, like Dashboard, require a peer dependency to work but since all components were exported from a single file you were forced to install all peer dependencies. Even if you never imported, for instance, the status bar component.

  Every component that requires a peer dependency has now been moved to a subpath, such as `@uppy/react/dashboard`, so you only need to install the peer dependencies you need.

  **Example for `@uppy/react`:**

  **Before:**

  ```javascript
  import { Dashboard, StatusBar } from "@uppy/react";
  ```

  **Now:**

  ```javascript
  import Dashboard from "@uppy/react/dashboard";
  import StatusBar from "@uppy/react/status-bar";
  ```

### Patch Changes

- Updated dependencies [c5b51f6]
  - @uppy/remote-sources@3.0.0
  - @uppy/screen-capture@5.0.0
  - @uppy/image-editor@4.0.0
  - @uppy/webcam@5.0.0
  - @uppy/audio@3.0.0
  - @uppy/core@5.0.0

## 0.3.2

### Patch Changes

- 1b1a9e3: Define "files" in package.json
- Updated dependencies [1b1a9e3]
  - @uppy/remote-sources@2.4.2
  - @uppy/screen-capture@4.4.2
  - @uppy/image-editor@3.4.2
  - @uppy/webcam@4.3.2
  - @uppy/audio@2.2.2
  - @uppy/core@4.5.2

## 0.3.0

### Minor Changes

- 0c24c5a: Use TypeScript compiler instead of Babel

### Patch Changes

- Updated dependencies [0c24c5a]
- Updated dependencies [0c24c5a]
- Updated dependencies [0c24c5a]
  - @uppy/webcam@4.3.0
  - @uppy/core@4.5.0
  - @uppy/audio@2.2.0
  - @uppy/image-editor@3.4.0
  - @uppy/remote-sources@2.4.0
  - @uppy/screen-capture@4.4.0

## 0.2.0

Released: 2025-06-30
Included in: Uppy v4.18.0

- @uppy/components,@uppy/screen-capture: useScreenCapture fixes (Prakash / #5793)
- @uppy/components: Use webcam fixes2 (Mikael Finstad / #5791)
