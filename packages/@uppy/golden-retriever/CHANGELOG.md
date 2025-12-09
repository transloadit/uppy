# @uppy/golden-retriever

## 5.2.1

### Patch Changes

- d766c30: Fix: Don't restore `currentUploads` if no files are being restored.
- Updated dependencies [648f245]
  - @uppy/utils@7.1.5

## 5.2.0

### Minor Changes

- 79e6460: - Add PluginTypeRegistry and typed getPlugin overload in @uppy/core
  - Register plugin ids across packages so uppy.getPlugin('Dashboard' | 'Webcam') returns the concrete plugin type and removes the need to pass generics in getPlugin()

### Patch Changes

- cc3ff31: Move golden retriever clear files logic to the restore function. This prevents race condition bugs when storing state.
- Updated dependencies [79e6460]
- Updated dependencies [ac12f35]
- Updated dependencies [4817585]
  - @uppy/core@5.2.0
  - @uppy/utils@7.1.4

## 5.1.1

### Patch Changes

- 0c16fe4: - **Internal inter-package breaking change:** Remove hacky internal event `restore:get-data` that would send a function as its event data (to golden retriever for it to call the function to receive data from it). Add instead `restore:plugin-data-changed` that publishes data when it changes. This means that **old versions of `@uppy/transloadit` are not compatible with newest version of `@uppy/golden-retriever` (and vice versa)**.
  - Large internal refactor of Golden Retriever
  - Use `state-update` handler to trigger save to local storage and blobs, instead of doing it in various other event handlers (`complete`, `upload-success`, `file-removed`, `file-editor:complete`, `file-added`). this way we don't miss any state updates. also simplifies the code a lot. this fixes:
    - Always store blob when it changes - this fixes the bug when using the compressor plugin, it would store the uncompressed original blob (like when using image editor plugin)
  - Add back throttle: but throttling must happen on the actual local storage save calls inside MetaDataStore, _not_ the handleStateUpdate function, so we don't miss any state updates (and end up with inconsistent data). Note that there is still a race condition where if the user removes a file (causing the blob to be deleted), then quickly reloads the page before the throttled save has happened, the file will be restored but the blob will be missing, so it will become a ghost. this is probably not a big problem though. need to disable throttling when running tests (add it as an option to the plugin)
  - Fix implicit `any` types in #restore filesWithBlobs
  - Don't error when saving indexedDB file that already exists (make it idempotent)
  - Fix bug: Golden Retriever was not deleting from IndexedDbStore if ServiceWorkerStore exists, causing a storage leak
  - Remove unused Golden Retriever cleanup.ts
  - Clean up stored files on `complete` event _only_ if _all_ files succeeded (no failed files). this allows the user to retry failed files if they get interrupted - fixes #5927, closes #5955
  - Only set `isGhost` for non-successful files - it doesn't make sense for successfully uploaded files to be ghosted because they're already done. #5930
  - Add `upload-success` event handler `handleFileUploaded`: this handler will remove blobs of files that have successfully uploaded. this prevents leaking blobs when an upload with multiple files gets interrupted (but some files have uploaded successfully), because `#handleUploadComplete` (which normally does the cleanup) doesn't get called untill _all_ files are complete.
  - Fix `file-editor:complete` potential race condition: it would delete and add at the same time (without first awaiting delete operation)
  - Fix: Don't double `setState` when restoring
  - Improve types in golden retriever and MetaDataStore
  - MetaDataStore: move old state expiry to from `constructor` to `load()`
- Updated dependencies [0c16fe4]
  - @uppy/core@5.1.1
  - @uppy/utils@7.1.1

## 5.1.0

### Minor Changes

- 6c0cbe6: Converted sw.js to sw.ts so that it can be transpiled, in the build.

### Patch Changes

- 4b6a76c: added missing exports.
- 975317d: Removed "main" from package.json, since export maps serve as the contract for the public API.
- Updated dependencies [4b6a76c]
- Updated dependencies [975317d]
- Updated dependencies [9bac4c8]
  - @uppy/core@5.0.2
  - @uppy/utils@7.0.2

## 5.0.0

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

- Updated dependencies [d301c01]
- Updated dependencies [c5b51f6]
  - @uppy/utils@7.0.0
  - @uppy/core@5.0.0

## 4.2.3

### Patch Changes

- a0a248a: Fix golden retriever crash when removing a file after restoring and clicking upload
- Updated dependencies [eee05db]
  - @uppy/core@4.5.3

## 4.2.2

### Patch Changes

- 1b1a9e3: Define "files" in package.json
- Updated dependencies [1b1a9e3]
  - @uppy/utils@6.2.2
  - @uppy/core@4.5.2

## 4.2.0

### Minor Changes

- 0c24c5a: Use TypeScript compiler instead of Babel

### Patch Changes

- Updated dependencies [0c24c5a]
- Updated dependencies [0c24c5a]
  - @uppy/core@4.5.0
  - @uppy/utils@6.2.0

## 4.1.0

Released: 2025-01-06
Included in: Uppy v4.11.0

- @uppy/angular,@uppy/audio,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive-picker,@uppy/google-drive,@uppy/google-photos-picker,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/vue,@uppy/webcam,@uppy/webdav,@uppy/xhr-upload,@uppy/zoom: Remove "paths" from all tsconfig's (Merlijn Vos / #5572)

## 4.0.2

Released: 2024-12-05
Included in: Uppy v4.8.0

- @uppy/audio,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: cleanup tsconfig (Mikael Finstad / #5520)

## 4.0.1

Released: 2024-10-31
Included in: Uppy v4.6.0

- @uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react-native,@uppy/react,@uppy/redux-dev-tools,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/svelte,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: Fix links (Anthony Veaudry / #5492)

## 4.0.0-beta.5

Released: 2024-06-04
Included in: Uppy v4.0.0-beta.10

- @uppy/golden-retriever: remove unused `ready` setters (Mikael Finstad / #5200)

## 4.0.0-beta.1

Released: 2024-03-28
Included in: Uppy v4.0.0-beta.1

- @uppy/golden-retriever: migrate to TS (Merlijn Vos / #4989)

## 3.2.0

Released: 2024-03-27
Included in: Uppy v3.24.0

- @uppy/golden-retriever: migrate to TS (Merlijn Vos / #4989)

## 3.1.0

Released: 2023-07-06
Included in: Uppy v3.11.0

- @uppy/golden-retriever: refactor to modernize the codebase (Antoine du Hamel / #4520)

## 3.0.4

Released: 2023-06-19
Included in: Uppy v3.10.0

- @uppy/companion,@uppy/core,@uppy/dashboard,@uppy/golden-retriever,@uppy/status-bar,@uppy/utils: Migrate all lodash' per-method-packages usage to lodash. (LinusMain / #4274)

## 3.0.2

Released: 2022-10-19
Included in: Uppy v3.2.0

- @uppy/golden-retriever: Fix retry upload with Golden Retriever (Merlijn Vos / #4155)

## 3.0.1

Released: 2022-09-25
Included in: Uppy v3.1.0

- @uppy/golden-retriever: fix condition to load files from service worker (Merlijn Vos / #4115)
- @uppy/golden-retriever: Fix endless webcam re-render with Golden Retriever (Merlijn Vos / #4111)
- @uppy/audio,@uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/companion,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/redux-dev-tools,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/svelte,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: add missing entries to changelog for individual packages (Antoine du Hamel / #4092)

## 3.0.0

Released: 2022-08-22
Included in: Uppy v3.0.0

- Switch to ESM

## 2.1.0

Released: 2022-05-30
Included in: Uppy v2.11.0

- @uppy/angular,@uppy/audio,@uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/box,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/onedrive,@uppy/progress-bar,@uppy/react,@uppy/redux-dev-tools,@uppy/robodog,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: doc: update bundler recommendation (Antoine du Hamel / #3763)
- @uppy/golden-retriever: refactor to ESM (Antoine du Hamel / #3731)
