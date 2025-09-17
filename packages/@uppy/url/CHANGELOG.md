# @uppy/url

## 5.0.1

### Patch Changes

- 975317d: Removed "main" from package.json, since export maps serve as the contract for the public API.
- Updated dependencies [4b6a76c]
- Updated dependencies [975317d]
- Updated dependencies [9bac4c8]
  - @uppy/core@5.0.2
  - @uppy/companion-client@5.0.1
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
  - @uppy/companion-client@5.0.0
  - @uppy/core@5.0.0

## 4.3.2

### Patch Changes

- 1b1a9e3: Define "files" in package.json
- Updated dependencies [1b1a9e3]
  - @uppy/companion-client@4.5.2
  - @uppy/utils@6.2.2
  - @uppy/core@4.5.2

## 4.3.0

### Minor Changes

- 0c24c5a: Use TypeScript compiler instead of Babel

### Patch Changes

- Updated dependencies [0c24c5a]
- Updated dependencies [0c24c5a]
  - @uppy/core@4.5.0
  - @uppy/companion-client@4.5.0
  - @uppy/utils@6.2.0

## 4.2.4

Released: 2025-05-18
Included in: Uppy v4.16.0

- @uppy/audio,@uppy/box,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/google-drive-picker,@uppy/google-drive,@uppy/google-photos-picker,@uppy/image-editor,@uppy/instagram,@uppy/onedrive,@uppy/remote-sources,@uppy/screen-capture,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/webcam,@uppy/webdav,@uppy/zoom: ts: make locale strings optional (Merlijn Vos / #5728)

## 4.2.2

Released: 2025-02-03
Included in: Uppy v4.13.2

- @uppy/url: skip drag/dropped local files (Merlijn Vos / #5626)

## 4.2.0

Released: 2025-01-06
Included in: Uppy v4.11.0

- @uppy/angular,@uppy/audio,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive-picker,@uppy/google-drive,@uppy/google-photos-picker,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/vue,@uppy/webcam,@uppy/webdav,@uppy/xhr-upload,@uppy/zoom: Remove "paths" from all tsconfig's (Merlijn Vos / #5572)

## 4.1.3

Released: 2025-01-06
Included in: Uppy v4.10.0

- @uppy/core,@uppy/dashboard,@uppy/provider-views,@uppy/store-redux,@uppy/url: build(deps): bump nanoid from 5.0.7 to 5.0.9 (dependabot[bot] / #5544)

## 4.1.2

Released: 2024-12-05
Included in: Uppy v4.8.0

- @uppy/audio,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: cleanup tsconfig (Mikael Finstad / #5520)

## 4.1.1

Released: 2024-10-31
Included in: Uppy v4.6.0

- @uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react-native,@uppy/react,@uppy/redux-dev-tools,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/svelte,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: Fix links (Anthony Veaudry / #5492)

## 4.1.0

Released: 2024-08-29
Included in: Uppy v4.3.0

- @uppy/aws-s3,@uppy/box,@uppy/compressor,@uppy/dropbox,@uppy/facebook,@uppy/google-drive,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/onedrive,@uppy/screen-capture,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/xhr-upload,@uppy/zoom: export plugin options (Antoine du Hamel / #5433)

## 4.0.0-beta.7

Released: 2024-06-04
Included in: Uppy v4.0.0-beta.10

- @uppy/url: remove unused error handler (Mikael Finstad / #5200)

## 4.0.0-beta.6

Released: 2024-05-14
Included in: Uppy v4.0.0-beta.7

- @uppy/companion-client,@uppy/dropbox,@uppy/screen-capture,@uppy/unsplash,@uppy/url,@uppy/webcam: Use `title` consistently from locales (Merlijn Vos / #5134)

## 4.0.0-beta.1

Released: 2024-03-28
Included in: Uppy v4.0.0-beta.1

- @uppy/url: migrate to TS (Merlijn Vos / #4980)

## 3.6.0

Released: 2024-03-27
Included in: Uppy v3.24.0

- @uppy/url: migrate to TS (Merlijn Vos / #4980)

## 3.1.0

Released: 2022-10-19
Included in: Uppy v3.2.0

- @uppy/url: refactor `UrlUI` (Antoine du Hamel / #4143)
- @uppy/url: trim whitespace around user input (Andrew McIntee / #4143)

## 3.0.1

Released: 2022-09-25
Included in: Uppy v3.1.0

- @uppy/audio,@uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/companion,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/redux-dev-tools,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/svelte,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: add missing entries to changelog for individual packages (Antoine du Hamel / #4092)

## 3.0.0

Released: 2022-08-22
Included in: Uppy v3.0.0

- Switch to ESM

## 3.0.0-beta.2

Released: 2022-08-03
Included in: Uppy v3.0.0-beta.4

- @uppy/url: remove private methods from public API (Antoine du Hamel / #3934)

## 2.2.0

Released: 2022-06-07
Included in: Uppy v2.12.0

- @uppy/url: enable passing optional meta data to `addFile` (Brad Edelman / #3788)
- @uppy/url: fix `getFileNameFromUrl` (Brad Edelman / #3804)

## 2.1.1

Released: 2022-05-30
Included in: Uppy v2.11.0

- @uppy/angular,@uppy/audio,@uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/box,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/onedrive,@uppy/progress-bar,@uppy/react,@uppy/redux-dev-tools,@uppy/robodog,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: doc: update bundler recommendation (Antoine du Hamel / #3763)

## 2.1.0

Released: 2022-05-14
Included in: Uppy v2.10.0

- @uppy/url: refactor to ESM (Antoine du Hamel / #3713)

## 2.0.5

Released: 2021-12-07
Included in: Uppy v2.3.0

- @uppy/aws-s3,@uppy/box,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/google-drive,@uppy/image-editor,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/screen-capture,@uppy/status-bar,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/url,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: Refactor locale scripts & generate types and docs (Merlijn Vos / #3276)
