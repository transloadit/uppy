# @uppy/vue

## 3.1.0

### Minor Changes

- 72d2d68: Add @uppy/{screen-capture,status-bar,webcam} as optional peer dependencies

### Patch Changes

- Updated dependencies [72d2d68]
- Updated dependencies [26bf726]
  - @uppy/components@1.1.0

## 3.0.3

### Patch Changes

- 975317d: Removed "main" from package.json, since export maps serve as the contract for the public API.
- 9f18ac7: Export UppyContext and UppyContextSymbol
- Updated dependencies [4b6a76c]
- Updated dependencies [975317d]
  - @uppy/core@5.0.2
  - @uppy/components@1.0.2
  - @uppy/dashboard@5.0.2

## 3.0.2

### Patch Changes

- 49522ec: Remove preact/compat imports in favor of preact, preventing JSX type issues in certain setups.
- Updated dependencies [49522ec]
  - @uppy/components@1.0.1
  - @uppy/dashboard@5.0.1
  - @uppy/core@5.0.1

## 3.0.1

### Patch Changes

- a063bc3: Remove status-bar from export map

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

- Updated dependencies [e869243]
- Updated dependencies [c5b51f6]
  - @uppy/dashboard@5.0.0
  - @uppy/components@1.0.0
  - @uppy/core@5.0.0

## 2.4.2

### Patch Changes

- 1b1a9e3: Define "files" in package.json
- Updated dependencies [1b1a9e3]
  - @uppy/progress-bar@4.3.2
  - @uppy/components@0.3.2
  - @uppy/file-input@4.2.2
  - @uppy/status-bar@4.2.2
  - @uppy/dashboard@4.4.2
  - @uppy/drag-drop@4.2.2
  - @uppy/core@4.5.2

## 2.4.0

### Minor Changes

- 0c24c5a: Use TypeScript compiler instead of Babel

### Patch Changes

- 0c24c5a: Fix uppy prop in UppyContextProvider
- Updated dependencies [0c24c5a]
- Updated dependencies [0c24c5a]
  - @uppy/core@4.5.0
  - @uppy/components@0.3.0
  - @uppy/dashboard@4.4.0
  - @uppy/drag-drop@4.2.0
  - @uppy/file-input@4.2.0
  - @uppy/progress-bar@4.3.0
  - @uppy/status-bar@4.2.0

## 2.3.0

Released: 2025-06-30
Included in: Uppy v4.18.0

- @uppy/react,@uppy/svelte,@uppy/vue: Add useDropzone & useFileInput (Merlijn Vos / #5735)

## 2.1.0

Released: 2025-01-06
Included in: Uppy v4.11.0

- @uppy/angular,@uppy/audio,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive-picker,@uppy/google-drive,@uppy/google-photos-picker,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/vue,@uppy/webcam,@uppy/webdav,@uppy/xhr-upload,@uppy/zoom: Remove "paths" from all tsconfig's (Merlijn Vos / #5572)

## 2.0.3

Released: 2024-12-05
Included in: Uppy v4.8.0

- @uppy/audio,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: cleanup tsconfig (Mikael Finstad / #5520)

## 2.0.2

Released: 2024-10-31
Included in: Uppy v4.6.0

- @uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react-native,@uppy/react,@uppy/redux-dev-tools,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/svelte,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: Fix links (Anthony Veaudry / #5492)

## 2.0.0-beta.4

Released: 2024-06-27
Included in: Uppy v4.0.0-beta.13

- @uppy/vue: fix passing of `props` (Antoine du Hamel / #5281)

## 2.0.0-beta.1

Released: 2024-03-28
Included in: Uppy v4.0.0-beta.1

- @uppy/vue: migrate to Composition API with TS & drop Vue 2 support (Merlijn Vos / #5043)
- @uppy/vue: [v4.x] remove manual types (Antoine du Hamel / #4803)

## 1.1.0

Released: 2023-10-20
Included in: Uppy v3.18.0

- @uppy/vue: export FileInput (mdxiaohu / #4736)

## 1.0.1

Released: 2022-09-25
Included in: Uppy v3.1.0

- @uppy/audio,@uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/companion,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/redux-dev-tools,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/svelte,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: add missing entries to changelog for individual packages (Antoine du Hamel / #4092)

## 1.0.0

Released: 2022-08-22
Included in: Uppy v3.0.0

- @uppy/vue: move `@uppy/` packages to peer dependencies (Antoine du Hamel / #4024)
- Switch to ESM

## 0.4.8

Released: 2022-05-30
Included in: Uppy v2.11.0

- @uppy/angular,@uppy/audio,@uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/box,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/onedrive,@uppy/progress-bar,@uppy/react,@uppy/redux-dev-tools,@uppy/robodog,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: doc: update bundler recommendation (Antoine du Hamel / #3763)

## 0.4.7

Released: 2022-04-27
Included in: Uppy v2.9.4

- @uppy/vue: Add license field to package.json in @uppy/vue (Tobias Trumm / #3664)

## 0.4.6

Released: 2022-03-16
Included in: Uppy v2.8.0

- @uppy/vue: enforce use of file extension within the import path (Antoine du Hamel / #3560)

## 0.4.5

Released: 2021-12-21
Included in: Uppy v2.3.2

- @uppy/angular,@uppy/companion,@uppy/svelte,@uppy/vue: add `.npmignore` files to ignore `.gitignore` when packing (Antoine du Hamel / #3380)
