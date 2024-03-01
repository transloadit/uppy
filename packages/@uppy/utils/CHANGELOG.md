# @uppy/utils

## 5.7.4

Released: 2024-02-28
Included in: Uppy v3.23.0

- @uppy/companion-client,@uppy/utils,@uppy/xhr-upload: improvements for #4922 (Mikael Finstad / #4960)
- @uppy/utils: fix various type issues (Mikael Finstad / #4958)
- @uppy/utils: simplify `findDOMElements` (Mikael Finstad / #4957)

## 5.7.3

Released: 2024-02-22
Included in: Uppy v3.22.2

- @uppy/core,@uppy/utils: Introduce `ValidateableFile` & move `MinimalRequiredUppyFile` into utils (Antoine du Hamel / #4944)
- @uppy/utils: remove EventManager circular reference (Merlijn Vos / #4949)

## 5.7.1

Released: 2024-02-19
Included in: Uppy v3.22.0

- @uppy/utils: improve types for `finddomelement` (antoine du hamel / #4873)
- @uppy/utils: improve `preprocess` and `postprocess` types (antoine du hamel / #4841)

## 5.7.0

Released: 2023-12-12
Included in: Uppy v3.21.0

- @uppy/utils: fix import in test files (Antoine du Hamel / #4806)

## 5.6.0

Released: 2023-11-08
Included in: Uppy v3.19.0

- @uppy/utils: refactor to TS (Antoine du Hamel / #4699)

## 5.5.1

Released: 2023-09-29
Included in: Uppy v3.17.0

- @uppy/utils: test: migrate to Vitest for Uppy core and Uppy plugins (Antoine du Hamel / #4700)

## 5.5.0

Released: 2023-09-05
Included in: Uppy v3.15.0

- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/companion-client,@uppy/core,@uppy/tus,@uppy/utils,@uppy/xhr-upload: Move remote file upload logic into companion-client (Merlijn Vos / #4573)

## 5.4.3

Released: 2023-07-24
Included in: Uppy v3.13.1

- @uppy/utils: align version of `preact` with the UI plugins (Antoine du Hamel / #4599)

## 5.4.0

Released: 2023-06-19
Included in: Uppy v3.10.0

- @uppy/companion,@uppy/core,@uppy/dashboard,@uppy/golden-retriever,@uppy/status-bar,@uppy/utils: Migrate all lodash' per-method-packages usage to lodash. (LinusMain / #4274)
- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/tus,@uppy/utils,@uppy/xhr-upload: When file is removed (or all are canceled), controller.abort queued requests (Artur Paikin / #4504)
- @uppy/utils: rename `EventTracker` -> `EventManager` (Stephen Wooten / #4481)

## 5.1.3

Released: 2023-03-07
Included in: Uppy v3.6.0

- @uppy/utils: workaround chrome crash (Mikael Finstad / #4310)

## 5.1.2

Released: 2023-01-26
Included in: Uppy v3.4.0

- @uppy/utils: better fallbacks for the drag & drop API (Antoine du Hamel / #4260)
- @uppy/utils: Fix getSpeed type (referenced `bytesTotal` instead of `uploadStarted`) (Pascal Wengerter / #4263)

## 5.1.1

Released: 2022-11-16
Included in: Uppy v3.3.1

- @uppy/utils: fix types (Antoine du Hamel / #4212)

## 5.1.0

Released: 2022-11-10
Included in: Uppy v3.3.0

- @uppy/utils: update typings for `RateLimitedQueue` (Antoine du Hamel / #4204)
- @uppy/utils: add `cause` support for `AbortError`s (Antoine du Hamel / #4198)

## 5.0.2

Released: 2022-09-25
Included in: Uppy v3.1.0

- @uppy/audio,@uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/companion,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/redux-dev-tools,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/svelte,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: add missing entries to changelog for individual packages (Antoine du Hamel / #4092)

## 5.0.1

Released: 2022-08-30
Included in: Uppy v3.0.1

- @uppy/utils: fix `relativePath` when drag&dropping a folder (Antoine du Hamel / #4043)
- @uppy/utils: Post-release website fixes (Merlijn Vos / #4038)

## 5.0.0

Released: 2022-08-22
Included in: Uppy v3.0.0

- @uppy/utils: fix drop of multiple files on Chromium browsers (Antoine du Hamel / #3998)
- @uppy/utils: Fix @uppy/utils microtip.scss export (Merlijn Vos / #3995)
- Switch to ESM

## 5.0.0-beta.1

Released: 2022-08-16
Included in: Uppy v3.0.0-beta.5

- @uppy/utils: Fix webp mimetype (Merlijn Vos / #3961)
- @uppy/utils: modernize `getDroppedFiles` (Antoine du Hamel / #3534)

## 4.1.0

Released: 2022-05-30
Included in: Uppy v2.11.0

- @uppy/utils: refactor to ESM (Antoine du Hamel / #3721)

## 4.0.7

Released: 2022-04-27
Included in: Uppy v2.9.4

- @uppy/utils: Fix getFileType for dicom images (Merlijn Vos / #3610)

## 4.0.6

Released: 2022-04-07
Included in: Uppy v2.9.2

- @uppy/aws-s3,@uppy/companion-client,@uppy/transloadit,@uppy/utils: Propagate `isNetworkError` through error wrappers (Renée Kooi / #3620)
