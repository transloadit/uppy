# uppy

## 5.1.0

### Minor Changes

- 3290864: Bring back StatusBar and DragDrop into the CDN bundle

### Patch Changes

- Updated dependencies [3290864]
  - @uppy/status-bar@5.0.0
  - @uppy/drag-drop@5.0.0

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
  - @uppy/google-photos-picker@1.0.0
  - @uppy/google-drive-picker@1.0.0
  - @uppy/thumbnail-generator@5.0.0
  - @uppy/companion-client@5.0.0
  - @uppy/golden-retriever@5.0.0
  - @uppy/provider-views@5.0.0
  - @uppy/remote-sources@3.0.0
  - @uppy/screen-capture@5.0.0
  - @uppy/store-default@5.0.0
  - @uppy/google-drive@5.0.0
  - @uppy/image-editor@4.0.0
  - @uppy/drop-target@4.0.0
  - @uppy/transloadit@5.0.0
  - @uppy/compressor@3.0.0
  - @uppy/xhr-upload@5.0.0
  - @uppy/instagram@5.0.0
  - @uppy/facebook@5.0.0
  - @uppy/onedrive@5.0.0
  - @uppy/unsplash@5.0.0
  - @uppy/dropbox@5.0.0
  - @uppy/locales@5.0.0
  - @uppy/aws-s3@5.0.0
  - @uppy/webcam@5.0.0
  - @uppy/audio@3.0.0
  - @uppy/core@5.0.0
  - @uppy/form@5.0.0
  - @uppy/zoom@4.0.0
  - @uppy/box@4.0.0
  - @uppy/tus@5.0.0
  - @uppy/url@5.0.0
  - @uppy/webdav@1.0.0

## 4.18.3

### Patch Changes

- Updated dependencies [a0a248a]
- Updated dependencies [2f62f40]
- Updated dependencies [eee05db]
- Updated dependencies [79502f7]
  - @uppy/golden-retriever@4.2.3
  - @uppy/provider-views@4.5.3
  - @uppy/core@4.5.3
  - @uppy/thumbnail-generator@4.2.3

## 4.18.2

### Patch Changes

- ea04a4d: Add "files" in package.json to only publish what's needed
- Updated dependencies [ee0b2fc]
- Updated dependencies [ea04a4d]
  - @uppy/transloadit@4.3.3
  - @uppy/locales@4.8.4

## 4.18.1

### Patch Changes

- Updated dependencies [c15c6fd]
- Updated dependencies [1a0beb9]
  - @uppy/status-bar@4.2.3
  - @uppy/dashboard@4.4.3
  - @uppy/locales@4.8.3

## 4.19.0

### Minor Changes

- 0c24c5a: Use TypeScript compiler instead of Babel

### Patch Changes

- Updated dependencies [0c24c5a]
- Updated dependencies [0c24c5a]
- Updated dependencies [49e98ab]
- Updated dependencies [0c24c5a]
  - @uppy/webcam@4.3.0
  - @uppy/core@4.5.0
  - @uppy/xhr-upload@4.4.0
  - @uppy/audio@2.2.0
  - @uppy/aws-s3@4.3.0
  - @uppy/box@3.3.0
  - @uppy/companion-client@4.5.0
  - @uppy/compressor@2.3.0
  - @uppy/dashboard@4.4.0
  - @uppy/drag-drop@4.2.0
  - @uppy/drop-target@3.2.0
  - @uppy/dropbox@4.3.0
  - @uppy/facebook@4.3.0
  - @uppy/file-input@4.2.0
  - @uppy/form@4.2.0
  - @uppy/golden-retriever@4.2.0
  - @uppy/google-drive@4.4.0
  - @uppy/google-drive-picker@0.4.0
  - @uppy/google-photos-picker@0.4.0
  - @uppy/image-editor@3.4.0
  - @uppy/informer@4.3.0
  - @uppy/instagram@4.3.0
  - @uppy/onedrive@4.3.0
  - @uppy/progress-bar@4.3.0
  - @uppy/provider-views@4.5.0
  - @uppy/redux-dev-tools@4.1.0
  - @uppy/remote-sources@2.4.0
  - @uppy/screen-capture@4.4.0
  - @uppy/status-bar@4.2.0
  - @uppy/store-default@4.3.0
  - @uppy/store-redux@4.1.0
  - @uppy/thumbnail-generator@4.2.0
  - @uppy/transloadit@4.3.0
  - @uppy/tus@4.3.0
  - @uppy/unsplash@4.4.0
  - @uppy/url@4.3.0
  - @uppy/webdav@0.4.0
  - @uppy/zoom@3.3.0

## 4.0.0-beta.1

Released: 2024-03-28
Included in: Uppy v4.0.0-beta.1

- uppy: remove legacy bundle (Antoine du Hamel)

## 3.1.0

Released: 2022-09-25

- uppy: add a decoy `Core` export to warn users about the renaming (Antoine du
  Hamel / #4085)
- uppy: remove all remaining occurrences of `Uppy.Core` (Antoine du Hamel /
  #4082)

## 3.0.0

Released: 2022-08-22

- uppy: add `uppy.min.mjs` for ESM consumption.
