# @uppy/svelte

## 5.0.2

### Patch Changes

- da754b7: Fix props reactivity. Now when the value of a prop you pass to a component changes, it is actually picked up.
- Updated dependencies [34639ba]
  - @uppy/components@1.0.3

## 5.0.1

### Patch Changes

- 49522ec: Remove preact/compat imports in favor of preact, preventing JSX type issues in certain setups.
- Updated dependencies [49522ec]
  - @uppy/components@1.0.1
  - @uppy/dashboard@5.0.1
  - @uppy/core@5.0.1

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

- Updated dependencies [e869243]
- Updated dependencies [c5b51f6]
  - @uppy/dashboard@5.0.0
  - @uppy/components@1.0.0
  - @uppy/core@5.0.0

## 4.6.2

### Patch Changes

- 4aa708a: Fix prop passing and types

## 4.6.0

### Minor Changes

- 0c24c5a: Use TypeScript compiler instead of Babel

### Patch Changes

- Updated dependencies [0c24c5a]
- Updated dependencies [0c24c5a]
  - @uppy/core@4.5.0
  - @uppy/components@0.3.0
  - @uppy/dashboard@4.4.0
  - @uppy/drag-drop@4.2.0
  - @uppy/progress-bar@4.3.0
  - @uppy/status-bar@4.2.0

## 4.5.0

Released: 2025-06-30
Included in: Uppy v4.18.0

- @uppy/react,@uppy/svelte,@uppy/vue: Add useDropzone & useFileInput (Merlijn Vos / #5735)

## 4.2.0

Released: 2025-01-06
Included in: Uppy v4.11.0

- examples,@uppy/svelte: build(deps-dev): bump @sveltejs/kit from 2.5.17 to 2.8.3 (dependabot[bot] / #5526)

## 4.1.1

Released: 2024-10-31
Included in: Uppy v4.6.0

- @uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react-native,@uppy/react,@uppy/redux-dev-tools,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/svelte,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: Fix links (Anthony Veaudry / #5492)

## 4.1.0

Released: 2024-10-15
Included in: Uppy v4.5.0

- @uppy/svelte: use SvelteKit as the build tool (Merlijn Vos / #5484)

## 4.0.2

Released: 2024-09-20
Included in: Uppy v4.4.0

- @uppy/svelte: fix generated module to not bundle Svelte (Antoine du Hamel / #5446)
- examples,@uppy/svelte: Bump svelte from 4.2.18 to 4.2.19 (dependabot[bot] / #5440)

## 4.0.1

Released: 2024-08-20
Included in: Uppy v4.2.0

- @uppy/svelte: fix exports condition (Merlijn Vos / #5416)

## 4.0.0-beta.2

Released: 2024-04-29
Included in: Uppy v4.0.0-beta.4

- @uppy/svelte: Add svelte 5 as peer dep (frederikhors / #5122)

## 4.0.0-beta.1

Released: 2024-03-28
Included in: Uppy v4.0.0-beta.1

- @uppy/svelte: remove UMD output and make it use newer types (Antoine du Hamel / #5023)

## 3.1.5

Released: 2024-05-22
Included in: Uppy v3.25.4

- @uppy/svelte: do not attempt removing plugin before it's created (Antoine du Hamel / #5186)

## 3.1.4

Released: 2024-04-29
Included in: Uppy v3.25.0

- @uppy/svelte: Add svelte 5 as peer dep (frederikhors / #5122)

## 3.1.1

Released: 2023-10-20
Included in: Uppy v3.18.0

- @uppy/svelte: fix TS build command (Antoine du Hamel / #4720)

## 3.1.0

Released: 2023-09-29
Included in: Uppy v3.17.0

- @uppy/svelte: revert breaking change (Antoine du Hamel / #4694)
- @uppy/svelte: Upgrade Svelte to 4 (frederikhors / #4652)

## 3.0.1

Released: 2022-09-25
Included in: Uppy v3.1.0

- @uppy/audio,@uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/companion,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/redux-dev-tools,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/svelte,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: add missing entries to changelog for individual packages (Antoine du Hamel / #4092)

## 3.0.0

Released: 2022-08-30
Included in: Uppy v3.0.1

- @uppy/svelte: update peer dependencies (Antoine du Hamel / #4065)
- Switch to ESM

## 1.0.7

Released: 2021-12-21
Included in: Uppy v2.3.2

- @uppy/angular,@uppy/companion,@uppy/svelte,@uppy/vue: add `.npmignore` files to ignore `.gitignore` when packing (Antoine du Hamel / #3380)
