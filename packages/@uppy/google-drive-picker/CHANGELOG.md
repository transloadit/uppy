# @uppy/google-drive-picker

## 1.0.1

### Patch Changes

- 975317d: Removed "main" from package.json, since export maps serve as the contract for the public API.
- Updated dependencies [4b6a76c]
- Updated dependencies [975317d]
- Updated dependencies [9bac4c8]
  - @uppy/core@5.0.2
  - @uppy/companion-client@5.0.1
  - @uppy/provider-views@5.0.2
  - @uppy/utils@7.0.2

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

- Updated dependencies [d301c01]
- Updated dependencies [c5b51f6]
  - @uppy/utils@7.0.0
  - @uppy/companion-client@5.0.0
  - @uppy/provider-views@5.0.0
  - @uppy/core@5.0.0

## 0.4.2

### Patch Changes

- 1b1a9e3: Define "files" in package.json
- Updated dependencies [1b1a9e3]
- Updated dependencies [c66fd85]
  - @uppy/companion-client@4.5.2
  - @uppy/provider-views@4.5.2
  - @uppy/utils@6.2.2
  - @uppy/core@4.5.2

## 0.4.0

### Minor Changes

- 0c24c5a: Use TypeScript compiler instead of Babel

### Patch Changes

- Updated dependencies [0c24c5a]
- Updated dependencies [0c24c5a]
  - @uppy/core@4.5.0
  - @uppy/companion-client@4.5.0
  - @uppy/provider-views@4.5.0
  - @uppy/utils@6.2.0

## 0.3.5

Released: 2025-05-18
Included in: Uppy v4.16.0

- @uppy/audio,@uppy/box,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/google-drive-picker,@uppy/google-drive,@uppy/google-photos-picker,@uppy/image-editor,@uppy/instagram,@uppy/onedrive,@uppy/remote-sources,@uppy/screen-capture,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/webcam,@uppy/webdav,@uppy/zoom: ts: make locale strings optional (Merlijn Vos / #5728)

## 0.3.3

Released: 2025-02-03
Included in: Uppy v4.13.2

- @uppy/core,@uppy/google-drive-picker,@uppy/google-photos-picker,@uppy/provider-views:

## 0.3.1

Released: 2025-01-08
Included in: Uppy v4.12.0

- @uppy/google-drive-picker,@uppy/google-photos-picker: Fix Google Picker plugins locale (Merlijn Vos / #5575)

## 0.3.0

Released: 2025-01-06
Included in: Uppy v4.11.0

- @uppy/angular,@uppy/audio,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive-picker,@uppy/google-drive,@uppy/google-photos-picker,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/vue,@uppy/webcam,@uppy/webdav,@uppy/xhr-upload,@uppy/zoom: Remove "paths" from all tsconfig's (Merlijn Vos / #5572)

## 0.2.1

Released: 2024-12-17
Included in: Uppy v4.9.0

- @uppy/google-drive-picker,@uppy/google-photos-picker,@uppy/locales: Add missing Google Picker locale entries (Merlijn Vos / #5552)
- @uppy/google-drive-picker,@uppy/google-photos-picker: Fix TS generics on new Google Picker plugins (Merlijn Vos / #5550)

## 0.2.0

Released: 2024-12-05
Included in: Uppy v4.8.0

- @uppy/companion,@uppy/google-drive-picker,@uppy/google-photos-picker: Google Picker (Mikael Finstad / #5443)
