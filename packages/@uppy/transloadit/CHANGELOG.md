# @uppy/transloadit

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
  - @uppy/provider-views@5.0.0
  - @uppy/core@5.0.0
  - @uppy/tus@5.0.0

## 4.3.3

### Patch Changes

- ee0b2fc: Add `user_meta` type to `AssemblyResult`

## 4.3.2

### Patch Changes

- 1b1a9e3: Define "files" in package.json
- Updated dependencies [1b1a9e3]
- Updated dependencies [c66fd85]
  - @uppy/companion-client@4.5.2
  - @uppy/provider-views@4.5.2
  - @uppy/utils@6.2.2
  - @uppy/core@4.5.2
  - @uppy/tus@4.3.2

## 4.3.0

### Minor Changes

- 0c24c5a: Use TypeScript compiler instead of Babel

### Patch Changes

- Updated dependencies [0c24c5a]
- Updated dependencies [0c24c5a]
  - @uppy/core@4.5.0
  - @uppy/companion-client@4.5.0
  - @uppy/provider-views@4.5.0
  - @uppy/tus@4.3.0
  - @uppy/utils@6.2.0

## 4.2.0

Released: 2025-01-06
Included in: Uppy v4.11.0

- @uppy/angular,@uppy/audio,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive-picker,@uppy/google-drive,@uppy/google-photos-picker,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/vue,@uppy/webcam,@uppy/webdav,@uppy/xhr-upload,@uppy/zoom: Remove "paths" from all tsconfig's (Merlijn Vos / #5572)

## 4.1.4

Released: 2024-12-05
Included in: Uppy v4.8.0

- @uppy/audio,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: cleanup tsconfig (Mikael Finstad / #5520)

## 4.1.3

Released: 2024-10-31
Included in: Uppy v4.6.0

- @uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react-native,@uppy/react,@uppy/redux-dev-tools,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/svelte,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: Fix links (Anthony Veaudry / #5492)

## 4.1.2

Released: 2024-09-30
Included in: Uppy v4.4.1

- @uppy/transloadit: fix multiple upload batches & run again (Merlijn Vos / #5478)

## 4.1.0

Released: 2024-08-20
Included in: Uppy v4.2.0

- @uppy/transloadit: add execution_progress to AssemblyResponse type (Merlijn Vos / #5420)
- @uppy/transloadit: fix check if all files have been removed (Merlijn Vos / #5419)

## 4.0.2

Released: 2024-08-15
Included in: Uppy v4.1.1

- @uppy/transloadit: fix issue with `allowMultipleUploadBatches` (Mikael Finstad / #5400)
- @uppy/transloadit: fix many lurking `TypeError` (Mikael Finstad / #5399)

## 4.0.1

Released: 2024-07-30
Included in: Uppy v4.1.0

- @uppy/transloadit: do not mark `opts` as mandatory (Antoine du Hamel / #5375)

## 4.0.0-beta.10

Released: 2024-06-27
Included in: Uppy v4.0.0-beta.13

- @uppy/transloadit: fix strict type errors (Antoine du Hamel / #5271)
- @uppy/transloadit: simplify plugin to always run a single assembly (Merlijn Vos / #5158)

## 4.0.0-beta.9

Released: 2024-06-18
Included in: Uppy v4.0.0-beta.12

- @uppy/transloadit: also fix outdated assembly transloadit:result (Merlijn Vos / #5246)
- examples,@uppy/locales,@uppy/provider-views,@uppy/transloadit: Release: uppy@3.26.1 (github-actions[bot] / #5242)
- @uppy/transloadit: fix transloadit:result event (Merlijn Vos / #5231)

## 4.0.0-beta.6

Released: 2024-05-23
Included in: Uppy v4.0.0-beta.9

- @uppy/transloadit: do not cancel assembly when removing all files (Merlijn Vos / #5191)

## 4.0.0-beta.2

Released: 2024-04-11
Included in: Uppy v4.0.0-beta.2

- @uppy/transloadit: remove deprecated options (Merlijn Vos / #5056)

## 4.0.0-beta.1

Released: 2024-03-28
Included in: Uppy v4.0.0-beta.1

- @uppy/transloadit: migrate to TS (Merlijn Vos / #4987)

## 3.8.0

Released: 2024-06-18
Included in: Uppy v3.27.0

- @uppy/transloadit: also fix outdated assembly transloadit:result (Merlijn Vos / #5246)

## 3.7.1

Released: 2024-06-11
Included in: Uppy v3.26.1

- @uppy/transloadit: fix transloadit:result event (Merlijn Vos / #5231)

## 3.7.0

Released: 2024-06-04
Included in: Uppy v3.26.0

- @uppy/transloadit: remove `updateNumberOfFilesInAssembly` (Merlijn Vos / #5202)

## 3.6.2

Released: 2024-05-23
Included in: Uppy v3.25.5

- @uppy/transloadit: do not cancel assembly when removing all files (Merlijn Vos / #5191)

## 3.6.0

Released: 2024-03-27
Included in: Uppy v3.24.0

- @uppy/transloadit: migrate to TS (Merlijn Vos / #4987)

## 3.5.0

Released: 2024-02-19
Included in: Uppy v3.22.0

- @uppy/transloadit: add `clientname` option (marius / #4920)

## 3.3.0

Released: 2023-09-05
Included in: Uppy v3.15.0

- @uppy/transloadit: Emit assembly progress events (Marius / #4603)
- @uppy/transloadit: remove Socket.io (Antoine du Hamel / #4281)

## 3.2.1

Released: 2023-08-15
Included in: Uppy v3.14.0

- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/companion,@uppy/transloadit,@uppy/xhr-upload: use uppercase HTTP method names (Antoine du Hamel / #4612)

## 3.2.0

Released: 2023-07-13
Included in: Uppy v3.12.0

- @uppy/transloadit: fix error message (Antoine du Hamel / #4572)
- @uppy/transloadit: implement Server-sent event API (Antoine du Hamel / #4098)

## 3.1.6

Released: 2023-06-19
Included in: Uppy v3.10.0

- @uppy/transloadit: ensure `fields` is not nullish when there no uploaded files (Antoine du Hamel / #4487)

## 3.1.5

Released: 2023-05-15
Included in: Uppy v3.9.1

- @uppy/transloadit: clean up event listener to prevent cancelled assemblies (Merlijn Vos / #4447)

## 3.1.4

Released: 2023-05-02
Included in: Uppy v3.9.0

- @uppy/transloadit: Reset `tus` key in the file on error, so retried files are re-uploaded (Artur Paikin / #4421)

## 3.1.2

Released: 2023-04-04
Included in: Uppy v3.7.0

- @uppy/transloadit: fix socket error message (Artur Paikin / #4352)

## 3.1.1

Released: 2023-02-13
Included in: Uppy v3.5.0

- @uppy/transloadit: fix `assemblyOptions` option (Antoine du Hamel / #4316)

## 3.1.0

Released: 2023-01-26
Included in: Uppy v3.4.0

- @uppy/transloadit: introduce `assemblyOptions`, deprecate other options (Merlijn Vos / #4059)

## 3.0.2

Released: 2022-09-25
Included in: Uppy v3.1.0

- @uppy/audio,@uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/companion,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/redux-dev-tools,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/svelte,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: add missing entries to changelog for individual packages (Antoine du Hamel / #4092)

## 3.0.1

Released: 2022-08-30
Included in: Uppy v3.0.1

- @uppy/transloadit: improve deprecation notice (Antoine du Hamel / #4056)

## 3.0.0

Released: 2022-08-22
Included in: Uppy v3.0.0

- Switch to ESM

## 3.0.0-beta.4

Released: 2022-08-03
Included in: Uppy v3.0.0-beta.4

- @uppy/transloadit: remove static properties in favor of exports (Antoine du Hamel / #3927)

## 3.0.0-beta

Released: 2022-05-30
Included in: Uppy v3.0.0-beta

- @uppy/transloadit: remove IE 10 hack (Antoine du Hamel / #3777)

## 2.3.6

Released: 2022-08-02
Included in: Uppy v2.13.2

- @uppy/transloadit: send `assembly-cancelled` only once (Antoine du Hamel / #3937)

## 2.3.5

Released: 2022-07-27
Included in: Uppy v2.13.1

- @uppy/transloadit: cancel assemblies when all its files have been removed (Antoine du Hamel / #3893)

## 2.3.4

Released: 2022-07-18
Included in: Uppy v2.13.0

- @uppy/transloadit: fix outdated file ids and incorrect usage of files (Merlijn Vos / #3886)

## 2.3.3

Released: 2022-07-11
Included in: Uppy v2.12.3

- @uppy/transloadit: fix TypeError when file is cancelled asynchronously (Antoine du Hamel / #3872)
- @uppy/robodog,@uppy/transloadit: use modern syntax to simplify code (Antoine du Hamel / #3873)

## 2.3.2

Released: 2022-07-06
Included in: Uppy v2.12.2

- @uppy/locales,@uppy/transloadit: Fix undefined error in in onTusError (Merlijn Vos / #3848)

## 2.3.1

Released: 2022-06-09
Included in: Uppy v2.12.1

- @uppy/transloadit: fix `COMPANION_PATTERN` export (Antoine du Hamel / #3820)

## 2.3.0

Released: 2022-05-30
Included in: Uppy v2.11.0

- @uppy/angular,@uppy/audio,@uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/box,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/onedrive,@uppy/progress-bar,@uppy/react,@uppy/redux-dev-tools,@uppy/robodog,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: doc: update bundler recommendation (Antoine du Hamel / #3763)
- @uppy/transloadit: refactor to ESM (Antoine du Hamel / #3725)
- @uppy/transloadit: transloadit: propagate error details when creating Assembly fails (Renée Kooi / #3794)

## 2.2.0

Released: 2022-05-14
Included in: Uppy v2.10.0

- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/core,@uppy/react,@uppy/transloadit,@uppy/tus,@uppy/xhr-upload: proposal: Cancel assemblies optional (Mikael Finstad / #3575)
- @uppy/transloadit: add rate limiting for assembly creation and status polling (Antoine du Hamel / #3718)

## 2.1.5

Released: 2022-04-27
Included in: Uppy v2.9.4

- @uppy/transloadit: improve fetch error handling (Antoine du Hamel / #3637)

## 2.1.4

Released: 2022-04-07
Included in: Uppy v2.9.2

- @uppy/aws-s3,@uppy/companion-client,@uppy/transloadit,@uppy/utils: Propagate `isNetworkError` through error wrappers (Renée Kooi / #3620)

## 2.1.2

Released: 2022-03-24
Included in: Uppy v2.9.0

- @uppy/transloadit: close assembly if upload is cancelled (Antoine du Hamel / #3591)

## 2.1.1

Released: 2022-01-12
Included in: Uppy v2.4.1

- @uppy/transloadit: fix handling of Tus errors and rate limiting (Antoine du Hamel / #3429)
- @uppy/transloadit: simplify `#onTusError` (Antoine du Hamel / #3419)

## 2.1.0

Released: 2022-01-10
Included in: Uppy v2.4.0

- @uppy/transloadit: ignore rate limiting errors when polling (Antoine du Hamel / #3418)
- @uppy/transloadit: better defaults for rate limiting (Antoine du Hamel / #3414)

## 2.0.5

Released: 2021-12-07
Included in: Uppy v2.3.0

- @uppy/aws-s3,@uppy/box,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/google-drive,@uppy/image-editor,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/screen-capture,@uppy/status-bar,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/url,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: Refactor locale scripts & generate types and docs (Merlijn Vos / #3276)
