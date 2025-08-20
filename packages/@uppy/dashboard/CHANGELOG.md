# @uppy/dashboard

## 4.4.3

### Patch Changes

- c15c6fd: Make each entry in `strings` in locale type optional
- Updated dependencies [c15c6fd]
  - @uppy/status-bar@4.2.3

## 4.4.2

### Patch Changes

- 1b1a9e3: Define "files" in package.json
- Updated dependencies [1b1a9e3]
- Updated dependencies [c66fd85]
  - @uppy/thumbnail-generator@4.2.2
  - @uppy/provider-views@4.5.2
  - @uppy/status-bar@4.2.2
  - @uppy/informer@4.3.2
  - @uppy/utils@6.2.2
  - @uppy/core@4.5.2

## 4.4.0

### Minor Changes

- 0c24c5a: Use TypeScript compiler instead of Babel

### Patch Changes

- Updated dependencies [0c24c5a]
- Updated dependencies [0c24c5a]
  - @uppy/core@4.5.0
  - @uppy/informer@4.3.0
  - @uppy/provider-views@4.5.0
  - @uppy/status-bar@4.2.0
  - @uppy/thumbnail-generator@4.2.0
  - @uppy/utils@6.2.0

## 4.3.4

Released: 2025-05-18
Included in: Uppy v4.16.0

- @uppy/audio,@uppy/box,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/google-drive-picker,@uppy/google-drive,@uppy/google-photos-picker,@uppy/image-editor,@uppy/instagram,@uppy/onedrive,@uppy/remote-sources,@uppy/screen-capture,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/webcam,@uppy/webdav,@uppy/zoom: ts: make locale strings optional (Merlijn Vos / #5728)

## 4.3.2

Released: 2025-02-25
Included in: Uppy v4.13.3

- @uppy/dashboard: do not allow drag&drop of file preview (Merlijn Vos / #5650)

## 4.3.0

Released: 2025-01-06
Included in: Uppy v4.11.0

- @uppy/angular,@uppy/audio,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive-picker,@uppy/google-drive,@uppy/google-photos-picker,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/vue,@uppy/webcam,@uppy/webdav,@uppy/xhr-upload,@uppy/zoom: Remove "paths" from all tsconfig's (Merlijn Vos / #5572)

## 4.2.0

Released: 2025-01-06
Included in: Uppy v4.10.0

- @uppy/core,@uppy/dashboard,@uppy/provider-views,@uppy/store-redux,@uppy/url: build(deps): bump nanoid from 5.0.7 to 5.0.9 (dependabot[bot] / #5544)

## 4.1.3

Released: 2024-12-05
Included in: Uppy v4.8.0

- @uppy/audio,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: cleanup tsconfig (Mikael Finstad / #5520)

## 4.1.2

Released: 2024-10-31
Included in: Uppy v4.6.0

- @uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react-native,@uppy/react,@uppy/redux-dev-tools,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/svelte,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: Fix links (Anthony Veaudry / #5492)

## 4.1.1

Released: 2024-10-15
Included in: Uppy v4.5.0

- @uppy/dashboard: Dashboard - convert some files to typescript (Evgenia Karunus / #5367)
- @uppy/dashboard,@uppy/drag-drop,@uppy/file-input: `.handleInputChange()` - use `.currentTarget`; clear the input using `''` (Evgenia Karunus / #5381)

## 4.1.0

Released: 2024-08-29
Included in: Uppy v4.3.0

- @uppy/core,@uppy/dashboard: Pass container to `UIPlugin.render` for non-Preact integration (Merlijn Vos / #5437)

## 4.0.3

Released: 2024-08-15
Included in: Uppy v4.1.1

- @uppy/dashboard,@uppy/drag-drop,@uppy/file-input: Transform the `accept` prop into a string everywhere (Evgenia Karunus / #5380)

## 4.0.2

Released: 2024-07-30
Included in: Uppy v4.1.0

- @uppy/dashboard: make `toggleAddFilesPanel` args consistent (Evgenia Karunus / #5365)
- @uppy/dashboard: Dashboard - convert some files to typescript (Evgenia Karunus / #5359)

## 4.0.1

Released: 2024-07-15
Included in: Uppy v4.0.1

- @uppy/dashboard: propagate `setOptions` to `StatusBar` (Mikael Finstad / #5260)
- @uppy/dashboard,@uppy/drag-drop,@uppy/drop-target: `<Dashboard/>`, `<DragDrop/>`, `drop-target` - new anti-flickering solution (Evgenia Karunus / #5326)

## 4.0.0-beta.9

Released: 2024-06-04
Included in: Uppy v4.0.0-beta.10

- @uppy/dashboard: remove unused component props (Antoine du Hamel / #5213)
- @uppy/dashboard: remove deprecated `autoOpenFileEditor` option (Mikael Finstad / #5200)

## 4.0.0-beta.5

Released: 2024-05-03
Included in: Uppy v4.0.0-beta.5

- @uppy/audio,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/remote-sources,@uppy/tus,@uppy/utils: Format (Murderlon)

## 4.0.0-beta.4

Released: 2024-04-29
Included in: Uppy v4.0.0-beta.4

- @uppy/dashboard,@uppy/provider-views: Remove JSX global type everywhere (Merlijn Vos / #5117)
- @uppy/dashboard: fix type of trigger option (Merlijn Vos / #5106)
- @uppy/dashboard: add missing `x-zip-compress` archive type (Younes / #5081)

## 4.0.0-beta.1

Released: 2024-03-28
Included in: Uppy v4.0.0-beta.1

- @uppy/dashboard: refine type of private variables (Antoine du Hamel / #5027)
- @uppy/dashboard: refine option types (Antoine du Hamel / #5022)
- @uppy/dashboard: add new `autoOpen` option (Chris Grigg / #5001)
- @uppy/audio,@uppy/dashboard,@uppy/drop-target,@uppy/webcam: add missing exports (Antoine du Hamel / #5014)
- @uppy/dashboard: refactor to TypeScript (Antoine du Hamel / #4984)
- @uppy/dashboard: refactor to stable lifecycle method (Antoine du Hamel / #4999)

## 3.9.1

Released: 2024-06-27
Included in: Uppy v3.27.1

- @uppy/dashboard: fix handling of `null` for `doneButtonHandler` (Antoine du Hamel / #5283)

## 3.8.3

Released: 2024-05-07
Included in: Uppy v3.25.2

- @uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/status-bar: Upgrade @transloadit/prettier-bytes (Merlijn Vos / #5150)

## 3.8.2

Released: 2024-04-29
Included in: Uppy v3.25.0

- @uppy/dashboard,@uppy/provider-views: Remove JSX global type everywhere (Merlijn Vos / #5117)
- @uppy/dashboard: fix type of trigger option (Merlijn Vos / #5106)

## 3.8.1

Released: 2024-04-16
Included in: Uppy v3.24.3

- @uppy/dashboard: add missing `x-zip-compress` archive type (Younes / #5081)

## 3.8.0

Released: 2024-03-27
Included in: Uppy v3.24.0

- @uppy/dashboard: refine type of private variables (Antoine du Hamel / #5027)
- @uppy/dashboard: refine option types (Antoine du Hamel / #5022)
- @uppy/dashboard: add new `autoOpen` option (Chris Grigg / #5001)
- @uppy/audio,@uppy/dashboard,@uppy/drop-target,@uppy/webcam: add missing exports (Antoine du Hamel / #5014)
- @uppy/dashboard: refactor to TypeScript (Antoine du Hamel / #4984)
- @uppy/dashboard: refactor to stable lifecycle method (Antoine du Hamel / #4999)

## 3.7.4

Released: 2024-02-22
Included in: Uppy v3.22.2

- @uppy/dashboard: MetaEditor + ImageEditor - new state machine logic (Evgenia Karunus / #4939)

## 3.7.3

Released: 2024-02-20
Included in: Uppy v3.22.1

- @uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/status-bar: bump `@transloadit/prettier-bytes` (Antoine du Hamel / #4933)

## 3.7.2

Released: 2024-02-19
Included in: Uppy v3.22.0

- @uppy/dashboard: autoopenfileeditor - rename "edit file" to "edit image" (evgenia karunus / #4925)
- @uppy/dashboard: Uncouple native camera and video buttons from the `disableLocalFiles` option (jake mcallister / #4894)
- @uppy/dashboard: fix `typeerror` when `file.remote` is nullish (antoine du hamel / #4825)

## 3.7.1

Released: 2023-11-12
Included in: Uppy v3.19.1

- @uppy/dashboard: fix(@uppy/dashboard): fix wrong option type in index.d.ts (dzcpy / #4788)
- @uppy/core,@uppy/dashboard,@uppy/react-native: Update Uppy's blue color to meet WCAG contrast requirements (Alexander Zaytsev / #4777)

## 3.7.0

Released: 2023-11-08
Included in: Uppy v3.19.0

- @uppy/dashboard: Remove uppy-Dashboard-isFixed when uppy.close() is invoked (Artur Paikin / #4775)
- @uppy/core,@uppy/dashboard: don't cancel all files when clicking "done" (Mikael Finstad / #4771)

## 3.6.0

Released: 2023-10-20
Included in: Uppy v3.18.0

- @uppy/dashboard: auto discover and install plugins without target (Artur Paikin / #4343)

## 3.5.3

Released: 2023-09-18
Included in: Uppy v3.16.0

- @uppy/dashboard: Make file-editor:cancel event fire when the Image Editor “cancel” button is pressed (Artur Paikin / #4684)

## 3.5.2

Released: 2023-09-05
Included in: Uppy v3.15.0

- @uppy/dashboard: when showAddFilesPanel is true, aria-hidden should be the opposite (Artur Paikin / #4643)

## 3.4.1

Released: 2023-06-19
Included in: Uppy v3.10.0

- @uppy/companion,@uppy/core,@uppy/dashboard,@uppy/golden-retriever,@uppy/status-bar,@uppy/utils: Migrate all lodash' per-method-packages usage to lodash. (LinusMain / #4274)
- @uppy/dashboard: include the old state when setting new (Artur Paikin / #4490)

## 3.4.0

Released: 2023-04-18
Included in: Uppy v3.8.0

- @uppy/dashboard: Single File Mode: fix layout and make optional (Artur Paikin / #4374)

## 3.3.1

Released: 2023-03-07
Included in: Uppy v3.6.1

- @uppy/dashboard: Fix low-contrast hover styles (Alexander Zaytsev / #4347)

## 3.3.0

Released: 2023-03-07
Included in: Uppy v3.6.0

- @uppy/dashboard: update provider icon style (Alexander Zaytsev / #4345)

## 3.2.2

Released: 2023-02-13
Included in: Uppy v3.5.0

- @uppy/dashboard: fix dashboard acquirers list (Mikael Finstad / #4306)
- @uppy/dashboard: Dashboard: disallow clicking on buttons and links in Dashboard disabled mode (Artur Paikin / #4292)
- @uppy/audio,@uppy/core,@uppy/dashboard,@uppy/screen-capture: Warn more instead of erroring (Artur Paikin / #4302)

## 3.2.0

Released: 2022-11-10
Included in: Uppy v3.3.0

- @uppy/dashboard: Single file mode (Artur Paikin / #4188)

## 3.1.0

Released: 2022-09-25
Included in: Uppy v3.1.0

- @uppy/dashboard: add dashboard:show-panel event (Jon-Pierre Sanchez / #4108)
- @uppy/audio,@uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/companion,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/redux-dev-tools,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/svelte,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: add missing entries to changelog for individual packages (Antoine du Hamel / #4092)

## 3.0.1

Released: 2022-08-30
Included in: Uppy v3.0.1

- @uppy/dashboard,@uppy/webcam: add nativeCameraFacingMode to Webcam and Dashboard (Artur Paikin / #4047)
- @uppy/core,@uppy/dashboard,@uppy/thumbnail-generator: update definition type files for TS 4.8 compatibility (Antoine du Hamel / #4055)

## 3.0.0

Released: 2022-08-22
Included in: Uppy v3.0.0

- @uppy/core,@uppy/dashboard,@uppy/status-bar: Style tweaks: use all: initial + other resets (Artur Paikin / #3983)
- Switch to ESM

## 3.0.0-beta.3

Released: 2022-08-03
Included in: Uppy v3.0.0-beta.4

- @uppy/dashboard: change `copyToClipboard` signature (Antoine du Hamel / #3933)

## 3.0.0-beta.2

Released: 2022-07-27
Included in: Uppy v3.0.0-beta.3

- @uppy/dashboard,@uppy/webcam: Add support for `mobileNativeCamera` option to Webcam and Dashboard (Artur Paikin / #3844)
- @uppy/aws-s3,@uppy/core,@uppy/dashboard,@uppy/store-redux,@uppy/xhr-upload: upgrade `nanoid` to v4 (Antoine du Hamel / #3904)

## 3.0.0-beta.1

Released: 2022-06-09
Included in: Uppy v3.0.0-beta.1

- @uppy/core,@uppy/dashboard: fix types for some events (Antoine du Hamel / #3812)

## 2.4.1

Released: 2022-07-27
Included in: Uppy v2.13.1

- @uppy/dashboard,@uppy/image-editor,@uppy/remote-sources: Fix `uppy.close()` crashes when remote-sources or image-editor is installed (Merlijn Vos / #3914)

## 2.3.0

Released: 2022-05-30
Included in: Uppy v2.11.0

- @uppy/angular,@uppy/audio,@uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/box,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/onedrive,@uppy/progress-bar,@uppy/react,@uppy/redux-dev-tools,@uppy/robodog,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: doc: update bundler recommendation (Antoine du Hamel / #3763)
- @uppy/dashboard: refactor to ESM (Antoine du Hamel / #3701)
- @uppy/dashboard: use webkitRelativePath when querying a file's relative path (Eduard Müller / taktik / #3766)

## 2.1.4

Released: 2022-02-14
Included in: Uppy v2.5.0

- @uppy/core,@uppy/dashboard,@uppy/thumbnail-generator: Add dashboard and UIPlugin types (Merlijn Vos / #3426)
- @uppy/dashboard: check if info array is empty (Artur Paikin / #3442)

## 2.1.3

Released: 2021-12-09
Included in: Uppy v2.3.1

- @uppy/aws-s3,@uppy/core,@uppy/dashboard,@uppy/store-redux,@uppy/xhr-upload: deps: use `nanoid/non-secure` to workaround react-native limitation (Antoine du Hamel / #3350)

## 2.1.2

Released: 2021-12-07
Included in: Uppy v2.3.0

- @uppy/dashboard: Save meta fields when opening the image editor (Merlijn Vos / #3339)
- @uppy/aws-s3,@uppy/box,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/google-drive,@uppy/image-editor,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/screen-capture,@uppy/status-bar,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/url,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: Refactor locale scripts & generate types and docs (Merlijn Vos / #3276)
