# @uppy/compressor

## 3.0.1

### Patch Changes

- 975317d: Removed "main" from package.json, since export maps serve as the contract for the public API.
- Updated dependencies [4b6a76c]
- Updated dependencies [975317d]
- Updated dependencies [9bac4c8]
  - @uppy/core@5.0.2
  - @uppy/utils@7.0.2

## 3.0.0

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

## 2.3.2

### Patch Changes

- 1b1a9e3: Define "files" in package.json
- Updated dependencies [1b1a9e3]
  - @uppy/utils@6.2.2
  - @uppy/core@4.5.2

## 2.3.0

### Minor Changes

- 0c24c5a: Use TypeScript compiler instead of Babel

### Patch Changes

- Updated dependencies [0c24c5a]
- Updated dependencies [0c24c5a]
  - @uppy/core@4.5.0
  - @uppy/utils@6.2.0

## 2.2.0

Released: 2025-01-06
Included in: Uppy v4.11.0

- @uppy/angular,@uppy/audio,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive-picker,@uppy/google-drive,@uppy/google-photos-picker,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/vue,@uppy/webcam,@uppy/webdav,@uppy/xhr-upload,@uppy/zoom: Remove "paths" from all tsconfig's (Merlijn Vos / #5572)

## 2.1.1

Released: 2024-12-05
Included in: Uppy v4.8.0

- @uppy/audio,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: cleanup tsconfig (Mikael Finstad / #5520)

## 2.1.0

Released: 2024-08-29
Included in: Uppy v4.3.0

- @uppy/aws-s3,@uppy/box,@uppy/compressor,@uppy/dropbox,@uppy/facebook,@uppy/google-drive,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/onedrive,@uppy/screen-capture,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/xhr-upload,@uppy/zoom: export plugin options (Antoine du Hamel / #5433)

## 2.0.1

Released: 2024-07-30
Included in: Uppy v4.1.0

- @uppy/compressor: mark `quality` as optional (Antoine du Hamel / #5374)

## 2.0.0-beta.5

Released: 2024-05-03
Included in: Uppy v4.0.0-beta.5

- @uppy/audio,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/remote-sources,@uppy/tus,@uppy/utils: Format (Murderlon)

## 1.1.4

Released: 2024-05-07
Included in: Uppy v3.25.2

- @uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/status-bar: Upgrade @transloadit/prettier-bytes (Merlijn Vos / #5150)

## 1.1.1

Released: 2024-02-20
Included in: Uppy v3.22.1

- @uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/status-bar: bump `@transloadit/prettier-bytes` (Antoine du Hamel / #4933)

## 1.1.0

Released: 2024-02-19
Included in: Uppy v3.22.0

- @uppy/compressor: upgrade compressorjs (merlijn vos / #4924)
- @uppy/compressor: migrate to ts (mikael finstad / #4907)

## 1.0.3

Released: 2023-09-18
Included in: Uppy v3.16.0

- @uppy/compressor: update file.meta.name after compression, becase format/extension might have changed (Artur Paikin / #4645)

## 1.0.1

Released: 2022-09-25
Included in: Uppy v3.1.0

- @uppy/audio,@uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/companion,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/redux-dev-tools,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/svelte,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: add missing entries to changelog for individual packages (Antoine du Hamel / #4092)

## 1.0.0

Released: 2022-08-22
Included in: Uppy v3.0.0

- Switch to ESM

## 1.0.0-beta.3

Released: 2022-08-16
Included in: Uppy v3.0.0-beta.5

- @uppy/compressor: Fix Compressor being broken when no name is in the compressed blob (Artur Paikin / #3947)

## 0.3.1

Released: 2022-07-27
Included in: Uppy v2.13.1

- @uppy/compressor: fix upload causing meta name to reset (Justin / #3890)

## 0.3.0

Released: 2022-05-30
Included in: Uppy v2.11.0

- @uppy/compressor: Fix Compressor docs, pass files array to compressor:complete event (Artur Paikin / #3682)

## 0.2.5

Released: 2022-04-27
Included in: Uppy v2.9.4

- @uppy/compressor: Set meta on file compression (Camilo Forero / #3644)

## 0.2.4

Released: 2022-04-07
Included in: Uppy v2.9.2

- @uppy/compressor: Merge new name and type into compressed file (Camilo Forero / #3606)

## 0.2.3

Released: 2022-03-16
Included in: Uppy v2.8.0

- @uppy/compressor: ignore remote files, calculate savings correctly (Artur Paikin / #3578)

## 0.2.2

Released: 2022-02-16
Included in: Uppy v2.5.1

- @uppy/compressor: Add image compressor plugin (Artur Paikin / #3471)
