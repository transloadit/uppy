# @uppy/components

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
