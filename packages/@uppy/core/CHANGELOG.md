# @uppy/core

## 4.5.2

### Patch Changes

- 1b1a9e3: Define "files" in package.json
- Updated dependencies [1b1a9e3]
  - @uppy/store-default@4.3.2
  - @uppy/utils@6.2.2

## 4.5.0

### Minor Changes

- 0c24c5a: Use TypeScript compiler instead of Babel

### Patch Changes

- 0c24c5a: Resolve stale state in `checkAndUpdateFileState`
- Updated dependencies [0c24c5a]
  - @uppy/store-default@4.3.0
  - @uppy/utils@6.2.0

## 4.4.6

Released: 2025-06-02
Included in: Uppy v4.17.0

- @uppy/core: fix missing required meta field error not updating (Prakash / #5766)

## 4.4.5

Released: 2025-05-18
Included in: Uppy v4.16.0

- @uppy/core: fix undefined reference when cancelling an upload (Prakash / #5730)
- @uppy/audio,@uppy/box,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/google-drive-picker,@uppy/google-drive,@uppy/google-photos-picker,@uppy/image-editor,@uppy/instagram,@uppy/onedrive,@uppy/remote-sources,@uppy/screen-capture,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/webcam,@uppy/webdav,@uppy/zoom: ts: make locale strings optional (Merlijn Vos / #5728)

## 4.4.4

Released: 2025-04-08
Included in: Uppy v4.14.0

- @uppy/core: dry retryAll() and upload() (Mikael Finstad / #5691)
- @uppy/core: fix locale type for plugins (Merlijn Vos / #5700)
- @uppy/core: fix events when retrying with upload() (Prakash / #5696)

## 4.4.3

Released: 2025-03-13
Included in: Uppy v4.13.4

- @uppy/core: make upload() idempotent (Merlijn Vos / #5677)

## 4.4.2

Released: 2025-02-03
Included in: Uppy v4.13.2

- @uppy/core,@uppy/google-drive-picker,@uppy/google-photos-picker,@uppy/provider-views:

## 4.4.0

Released: 2025-01-06
Included in: Uppy v4.11.0

- @uppy/angular,@uppy/audio,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive-picker,@uppy/google-drive,@uppy/google-photos-picker,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/vue,@uppy/webcam,@uppy/webdav,@uppy/xhr-upload,@uppy/zoom: Remove "paths" from all tsconfig's (Merlijn Vos / #5572)

## 4.3.2

Released: 2025-01-06
Included in: Uppy v4.10.0

- @uppy/core,@uppy/dashboard,@uppy/provider-views,@uppy/store-redux,@uppy/url: build(deps): bump nanoid from 5.0.7 to 5.0.9 (dependabot[bot] / #5544)

## 4.3.1

Released: 2024-12-17
Included in: Uppy v4.9.0

- @uppy/core: bring back validateRestrictions (Merlijn Vos / #5538)

## 4.3.0

Released: 2024-12-05
Included in: Uppy v4.8.0

- @uppy/core,@uppy/provider-views: move useStore out of core (Mikael Finstad / #5533)
- @uppy/audio,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: cleanup tsconfig (Mikael Finstad / #5520)

## 4.2.3

Released: 2024-10-31
Included in: Uppy v4.6.0

- @uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react-native,@uppy/react,@uppy/redux-dev-tools,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/svelte,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: Fix links (Anthony Veaudry / #5492)

## 4.2.0

Released: 2024-08-29
Included in: Uppy v4.3.0

- @uppy/core,@uppy/dashboard: Pass container to `UIPlugin.render` for non-Preact integration (Merlijn Vos / #5437)

## 4.1.0

Released: 2024-07-30
Included in: Uppy v4.1.0

- @uppy/core,@uppy/store-default: export `Store` type (Merlijn Vos / #5373)

## 4.0.1

Released: 2024-07-15
Included in: Uppy v4.0.1

- @uppy/core: make `Meta` generic optional (Merlijn Vos / #5330)

## 4.0.0

Released: 2024-07-10
Included in: Uppy v4.0.0

- @uppy/core: bring back resetProgress (Merlijn Vos / #5320)
- @uppy/core: export UppyOptions, UppyFile, Meta, Body (Merlijn Vos / #5319)

## 4.0.0-beta.9

Released: 2024-06-04
Included in: Uppy v4.0.0-beta.10

- @uppy/core: remove unnecessary todo (Mikael Finstad / #5200)
- @uppy/core: remove `'upload-started'` event (Mikael Finstad / #5200)
- @uppy/core: add type tests (Merlijn Vos / #5153)
- @uppy/core: pass file to events consistently (Merlijn Vos / #5136)
- @uppy/core: remove `reason` (Antoine du Hamel / #5159)
- @uppy/core: remove `resetProgress` and `reset-progress` (Mikael Finstad / #5221)

## 4.0.0-beta.8

Released: 2024-05-22
Included in: Uppy v4.0.0-beta.8

- @uppy/core: resolve some (breaking) TODOs (Antoine du Hamel / #4824)

## 4.0.0-beta.7

Released: 2024-05-14
Included in: Uppy v4.0.0-beta.7

- @uppy/core: close->destroy, clearUploadedFiles->clear (Merlijn Vos / #5154)

## 4.0.0-beta.5

Released: 2024-05-03
Included in: Uppy v4.0.0-beta.5

- @uppy/core: make UppyEventMap more readable (Murderlon)
- @uppy/audio,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/remote-sources,@uppy/tus,@uppy/utils: Format (Murderlon)
- @uppy/core: add instance ID to generated IDs (Merlijn Vos / #5080)
- @uppy/core: reference updated i18n in Restricter (Merlijn Vos / #5118)

## 4.0.0-beta.4

Released: 2024-04-29
Included in: Uppy v4.0.0-beta.4

- @uppy/core: Release: uppy@3.24.2 (github-actions[bot] / #5084)
- @uppy/core: fix `setOptions` not re-rendereing plugin UI (Antoine du Hamel / #5082)

## 4.0.0-beta.3

Released: 2024-04-15
Included in: Uppy v4.0.0-beta.3

- @uppy/core: fix `setOptions` not re-rendereing plugin UI (Antoine du Hamel / #5082)

## 4.0.0-beta.2

Released: 2024-04-11
Included in: Uppy v4.0.0-beta.2

- @uppy/core: use variadic arguments for `uppy.use` (Antoine du Hamel / #4888)

## 4.0.0-beta.1

Released: 2024-03-28
Included in: Uppy v4.0.0-beta.1

- @uppy/core: refine type of private variables (Antoine du Hamel / #5028)
- @uppy/core: fix some type errors (Antoine du Hamel / #5015)
- @uppy/core: various type fixes (Antoine du Hamel / #4995)
- @uppy/core,@uppy/provider-views: Fix breadcrumbs (Evgenia Karunus / #4986)

## 3.13.1

Released: 2024-07-02
Included in: Uppy v3.27.2

- @uppy/core: add `clearUploadedFiles` to type definition (Augustine Smith / #5295)

## 3.12.0

Released: 2024-06-04
Included in: Uppy v3.26.0

- @uppy/core: check capabilities in clearUploadedFiles (Merlijn Vos / #5201)
- @uppy/core: PartialTree - change the `maxTotalFileSize` error (Evgenia Karunus / #5203)

## 3.11.3

Released: 2024-05-14
Included in: Uppy v3.25.3

- @uppy/core: make getObjectOfFilesPerState more efficient (Merlijn Vos / #5155)

## 3.11.2

Released: 2024-05-07
Included in: Uppy v3.25.2

- @uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/status-bar: Upgrade @transloadit/prettier-bytes (Merlijn Vos / #5150)

## 3.11.1

Released: 2024-05-03
Included in: Uppy v3.25.1

- @uppy/core: make UppyEventMap more readable (Murderlon)

## 3.11.0

Released: 2024-04-29
Included in: Uppy v3.25.0

- @uppy/core: add instance ID to generated IDs (Merlijn Vos / #5080)
- @uppy/core: reference updated i18n in Restricter (Merlijn Vos / #5118)

## 3.10.1

Released: 2024-04-15
Included in: Uppy v3.24.2

- @uppy/core: fix `setOptions` not re-rendereing plugin UI (Antoine du Hamel / #5082)

## 3.10.0

Released: 2024-03-27
Included in: Uppy v3.24.0

- @uppy/core: refine type of private variables (Antoine du Hamel / #5028)
- @uppy/core: fix some type errors (Antoine du Hamel / #5015)
- @uppy/core: various type fixes (Antoine du Hamel / #4995)
- @uppy/core,@uppy/provider-views: Fix breadcrumbs (Evgenia Karunus / #4986)

## 3.9.3

Released: 2024-02-28
Included in: Uppy v3.23.0

- @uppy/core: remove unused import (Antoine du Hamel / #4972)

## 3.9.2

Released: 2024-02-22
Included in: Uppy v3.22.2

- @uppy/core: fix plugin detection (Antoine du Hamel / #4951)
- @uppy/core,@uppy/utils: Introduce `ValidateableFile` & move `MinimalRequiredUppyFile` into utils (Antoine du Hamel / #4944)
- @uppy/core: improve `UIPluginOptions` types (Merlijn Vos / #4946)

## 3.9.1

Released: 2024-02-20
Included in: Uppy v3.22.1

- @uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/status-bar: bump `@transloadit/prettier-bytes` (Antoine du Hamel / #4933)

## 3.9.0

Released: 2024-02-19
Included in: Uppy v3.22.0

- @uppy/core: add utility type to help define plugin option types (antoine du hamel / #4885)
- @uppy/core: improve types of .use() (merlijn vos / #4882)
- @uppy/core: add `plugintarget` type and mark options as optional (antoine du hamel / #4874)
- @uppy/core: add `debuglogger` as export in manual types (antoine du hamel / #4831)
- @uppy/core: add missing requiredmetafields key in restrictions (darthf1 / #4819)
- @uppy/core: fix types (antoine du hamel / #4842)
- @uppy/core: refactor to ts (murderlon)

## 3.8.0

Released: 2023-12-12
Included in: Uppy v3.21.0

- @uppy/core: Fix onBeforeFileAdded with Golden Retriever (Merlijn Vos / #4799)

## 3.7.1

Released: 2023-11-12
Included in: Uppy v3.19.1

- @uppy/core,@uppy/dashboard,@uppy/react-native: Update Uppy's blue color to meet WCAG contrast requirements (Alexander Zaytsev / #4777)

## 3.7.0

Released: 2023-11-08
Included in: Uppy v3.19.0

- @uppy/core,@uppy/dashboard: don't cancel all files when clicking "done" (Mikael Finstad / #4771)
- @uppy/core: simplify types with class generic (JokcyLou / #4761)

## 3.6.1

Released: 2023-10-23
Included in: Uppy v3.18.1

- @uppy/core: fix `sideEffects` declaration (Antoine du Hamel / #4759)

## 3.6.0

Released: 2023-10-20
Included in: Uppy v3.18.0

- @uppy/core: mark the package as side-effect free (Antoine du Hamel / #4730)
- @uppy/core: type more events (Antoine du Hamel / #4719)

## 3.5.0

Released: 2023-09-05
Included in: Uppy v3.15.0

- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/companion-client,@uppy/core,@uppy/tus,@uppy/utils,@uppy/xhr-upload: Move remote file upload logic into companion-client (Merlijn Vos / #4573)

## 3.4.0

Released: 2023-08-15
Included in: Uppy v3.14.0

- @uppy/core: allow duplicate files with onBeforeFileAdded (Merlijn Vos / #4594)

## 3.2.1

Released: 2023-06-19
Included in: Uppy v3.10.0

- @uppy/companion,@uppy/core,@uppy/dashboard,@uppy/golden-retriever,@uppy/status-bar,@uppy/utils: Migrate all lodash' per-method-packages usage to lodash. (LinusMain / #4274)
- @uppy/core: Don't set late (throttled) progress event on a file that is 100% complete (Artur Paikin / #4507)
- @uppy/core: remove `state` getter from types (Antoine du Hamel / #4477)

## 3.2.0

Released: 2023-04-18
Included in: Uppy v3.8.0

- @uppy/core: improve performance of validating & uploading files (Mikael Finstad / #4402)
- @uppy/core,@uppy/locales,@uppy/provider-views: User feedback adding recursive folders take 2 (Mikael Finstad / #4399)

## 3.1.2

Released: 2023-04-04
Included in: Uppy v3.7.0

- @uppy/core: fix bug with `setOptions` (Nguyễn bảo Trung / #4350)

## 3.1.0

Released: 2023-03-07
Included in: Uppy v3.6.0

- @uppy/core: fix uppy.resetProgress() (Artur Paikin / #4337)
- @uppy/core: fix some types (Antoine du Hamel / #4332)
- @uppy/core: Fixed type of State.info to match reality being an array of info objects (Marc Bennewitz / #4321)

## 3.0.6

Released: 2023-02-13
Included in: Uppy v3.5.0

- @uppy/audio,@uppy/core,@uppy/dashboard,@uppy/screen-capture: Warn more instead of erroring (Artur Paikin / #4302)

## 3.0.5

Released: 2023-01-26
Included in: Uppy v3.4.0

- @uppy/core: fix metafields validation when used as function (Merlijn Vos / #4276)
- @uppy/core: fix typo in Uppy.test.js (Ikko Ashimine / #4235)

## 3.0.4

Released: 2022-10-24
Included in: Uppy v3.2.2

- @uppy/core: make cancel() and close() arguments optional in types (Merlijn Vos / #4161)

## 3.0.3

Released: 2022-10-19
Included in: Uppy v3.2.0

- @uppy/core: do not crash if a file is removed before the upload starts (Antoine du Hamel / #4148)
- @uppy/core: Fix Uppy.cancelAll and Uppy.close types (Sven Grunewaldt / #4128)

## 3.0.2

Released: 2022-09-25
Included in: Uppy v3.1.0

- @uppy/audio,@uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/companion,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/redux-dev-tools,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/svelte,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: add missing entries to changelog for individual packages (Antoine du Hamel / #4092)
- @uppy/core: Fix `Restrictor` counts ghost files against `maxNumberOfFiles` (Andrew McIntee / #4078)
- @uppy/core: fix types (Antoine du Hamel / #4072)

## 3.0.1

Released: 2022-08-30
Included in: Uppy v3.0.1

- @uppy/core,@uppy/dashboard,@uppy/thumbnail-generator: update definition type files for TS 4.8 compatibility (Antoine du Hamel / #4055)

## 3.0.0

Released: 2022-08-22
Included in: Uppy v3.0.0

- @uppy/core: core: uppy.addFile should accept browser File objects (Artur Paikin / #4020)
- @uppy/core,@uppy/dashboard,@uppy/status-bar: Style tweaks: use all: initial + other resets (Artur Paikin / #3983)
- Switch to ESM

## 3.0.0-beta.4

Released: 2022-08-16
Included in: Uppy v3.0.0-beta.5

- @uppy/core,@uppy/react: Fix all breaking todo comments for 3.0 (Merlijn Vos / #3907)

## 3.0.0-beta.2

Released: 2022-07-27
Included in: Uppy v3.0.0-beta.3

- @uppy/aws-s3,@uppy/core,@uppy/dashboard,@uppy/store-redux,@uppy/xhr-upload: upgrade `nanoid` to v4 (Antoine du Hamel / #3904)

## 3.0.0-beta.1

Released: 2022-06-09
Included in: Uppy v3.0.0-beta.1

- @uppy/core,@uppy/dashboard: fix types for some events (Antoine du Hamel / #3812)

## 2.3.2

Released: 2022-07-27
Included in: Uppy v2.13.1

- @uppy/core: Add missing type for retry-all event (Luc Boissaye / #3901)

## 2.3.1

Released: 2022-06-07
Included in: Uppy v2.12.0

- @uppy/core: fix `TypeError` when file was deleted (Antoine du Hamel / #3811)

## 2.3.0

Released: 2022-05-30
Included in: Uppy v2.11.0

- @uppy/angular,@uppy/audio,@uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/box,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/onedrive,@uppy/progress-bar,@uppy/react,@uppy/redux-dev-tools,@uppy/robodog,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: doc: update bundler recommendation (Antoine du Hamel / #3763)
- @uppy/core: refactor to ESM (Antoine du Hamel / #3744)

## 2.2.0

Released: 2022-05-14
Included in: Uppy v2.10.0

- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/core,@uppy/react,@uppy/transloadit,@uppy/tus,@uppy/xhr-upload: proposal: Cancel assemblies optional (Mikael Finstad / #3575)
- @uppy/core: add definition for addFiles method (Matteo Padovano / #3556)
- @uppy/core: wrap plugins in div.uppy-Root and set dir attrubute in UIPlugin (Artur Paikin / #3692)

## 2.1.10

Released: 2022-04-27
Included in: Uppy v2.9.5

- @uppy/core: fix `TypeError` when file was removed (Antoine du Hamel / #3670)

## 2.1.9

Released: 2022-04-27
Included in: Uppy v2.9.4

- @uppy/core: fix `TypeError` when file was removed (Antoine du Hamel / #3650)

## 2.1.8

Released: 2022-04-07
Included in: Uppy v2.9.3

- @uppy/core: fix TypeError in event handler when file was removed (Antoine du Hamel / #3629)

## 2.1.7

Released: 2022-03-29
Included in: Uppy v2.9.1

- @uppy/core: refactor: replace deprecated String.prototype.substr() (CommanderRoot / #3600)

## 2.1.6

Released: 2022-03-16
Included in: Uppy v2.8.0

- @uppy/core: Abstract restriction logic in a new Restricter class (Merlijn Vos / #3532)

## 2.1.5

Released: 2022-02-14
Included in: Uppy v2.5.0

- @uppy/core,@uppy/dashboard,@uppy/thumbnail-generator: Add dashboard and UIPlugin types (Merlijn Vos / #3426)

## 2.1.4

Released: 2021-12-09
Included in: Uppy v2.3.1

- @uppy/aws-s3,@uppy/core,@uppy/dashboard,@uppy/store-redux,@uppy/xhr-upload: deps: use `nanoid/non-secure` to workaround react-native limitation (Antoine du Hamel / #3350)

## 2.1.3

Released: 2021-12-07
Included in: Uppy v2.3.0

- @uppy/core: disable loose transpilation for legacy bundle (Antoine du Hamel / #3329)
- @uppy/aws-s3,@uppy/box,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/google-drive,@uppy/image-editor,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/screen-capture,@uppy/status-bar,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/url,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: Refactor locale scripts & generate types and docs (Merlijn Vos / #3276)
