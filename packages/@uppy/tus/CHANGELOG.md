# @uppy/tus

## 4.2.2

Released: 2025-01-22
Included in: Uppy v4.13.1

- @uppy/tus: fix resumeFromPreviousUpload race condition (Merlijn Vos / #5616)

## 4.2.0

Released: 2025-01-06
Included in: Uppy v4.11.0

- @uppy/angular,@uppy/audio,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive-picker,@uppy/google-drive,@uppy/google-photos-picker,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/vue,@uppy/webcam,@uppy/webdav,@uppy/xhr-upload,@uppy/zoom: Remove "paths" from all tsconfig's (Merlijn Vos / #5572)
- @uppy/tus: fix onBeforeRequest type (Dominik Schmidt / #5566)

## 4.1.5

Released: 2024-12-05
Included in: Uppy v4.8.0

- @uppy/audio,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: cleanup tsconfig (Mikael Finstad / #5520)

## 4.1.4

Released: 2024-11-11
Included in: Uppy v4.7.0

- @uppy/tus: fix event upload-success response.body.xhr (ItsOnlyBinary / #5503)

## 4.1.3

Released: 2024-10-31
Included in: Uppy v4.6.0

- @uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react-native,@uppy/react,@uppy/redux-dev-tools,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/svelte,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: Fix links (Anthony Veaudry / #5492)

## 4.1.2

Released: 2024-10-15
Included in: Uppy v4.5.0

- @uppy/tus: tus: Avoid duplicate `upload-error` event (Marius / #5485)

## 4.1.1

Released: 2024-09-20
Included in: Uppy v4.4.0

- @uppy/tus: fix retry check for status code 400 (Merlijn Vos / #5461)
- @uppy/tus: set response from tus-js-client (Merlijn Vos / #5456)
- @uppy/tus: correctly type tus on UppyFile (Merlijn Vos / #5454)

## 4.1.0

Released: 2024-08-29
Included in: Uppy v4.3.0

- @uppy/aws-s3,@uppy/box,@uppy/compressor,@uppy/dropbox,@uppy/facebook,@uppy/google-drive,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/onedrive,@uppy/screen-capture,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/xhr-upload,@uppy/zoom: export plugin options (Antoine du Hamel / #5433)

## 4.0.1

Released: 2024-08-15
Included in: Uppy v4.1.1

- @uppy/tus: Fix onShouldRetry type signature (Trent Nadeau / #5387)

## 4.0.0-beta.6

Released: 2024-06-04
Included in: Uppy v4.0.0-beta.10

- @uppy/aws-s3,@uppy/tus,@uppy/utils,@uppy/xhr-upload: remove `uploader` from `upload-progress` event (Mikael Finstad / #5200)

## 4.0.0-beta.4

Released: 2024-05-03
Included in: Uppy v4.0.0-beta.5

- @uppy/audio,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/remote-sources,@uppy/tus,@uppy/utils: Format (Murderlon)

## 4.0.0-beta.1

Released: 2024-03-28
Included in: Uppy v4.0.0-beta.1

- @uppy/aws-s3-multipart,@uppy/tus,@uppy/utils,@uppy/xhr-upload: Make `allowedMetaFields` consistent (Merlijn Vos / #5011)

## 3.5.5

Released: 2024-05-22
Included in: Uppy v3.25.4

- @uppy/tus: fix no headers passed to companion if argument is a function (netdown / #5182)

## 3.5.1

Released: 2024-02-19
Included in: Uppy v3.22.0

-  @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/companion-client,@uppy/tus,@uppy/xhr-upload: update `uppyfile` objects before emitting events (antoine du hamel / #4928)
- @uppy/tus: migrate to ts (merlijn vos / #4899)
- @uppy/companion,@uppy/tus: bump `tus-js-client` version range (merlijn vos / #4848)

## 3.3.0

Released: 2023-09-18
Included in: Uppy v3.16.0

- @uppy/tus: Fix: Utilize user-defined onSuccess, onError, and onProgress callbacks in @uppy/tus (choi sung keun / #4674)

## 3.2.0

Released: 2023-09-05
Included in: Uppy v3.15.0

- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/companion-client,@uppy/core,@uppy/tus,@uppy/utils,@uppy/xhr-upload: Move remote file upload logic into companion-client (Merlijn Vos / #4573)

## 3.1.3

Released: 2023-08-15
Included in: Uppy v3.14.0

- @uppy/aws-s3,@uppy/tus,@uppy/xhr-upload:  Invoke headers function for remote uploads (Dominik Schmidt / #4596)

## 3.1.2

Released: 2023-07-06
Included in: Uppy v3.11.0

- @uppy/tus: retry on 423 HTTP error code (Antoine du Hamel / #4512)

## 3.1.1

Released: 2023-06-19
Included in: Uppy v3.10.0

- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/tus,@uppy/utils,@uppy/xhr-upload: When file is removed (or all are canceled), controller.abort queued requests (Artur Paikin / #4504)
- @uppy/aws-s3-multipart,@uppy/tus,@uppy/xhr-upload: Don't close socket while upload is still in progress (Artur Paikin / #4479)

## 3.0.6

Released: 2023-04-04
Included in: Uppy v3.7.0

- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/tus,@uppy/xhr-upload: make sure that we reset serverToken when an upload fails (Mikael Finstad / #4376)
- @uppy/tus: do not auto-open sockets, clean them up on abort (Antoine du Hamel)

## 3.0.5

Released: 2022-11-10
Included in: Uppy v3.3.0

- @uppy/aws-s3-multipart,@uppy/tus: fix `Timed out waiting for socket` (Antoine du Hamel / #4177)

## 3.0.4

Released: 2022-10-24
Included in: Uppy v3.2.2

- @uppy/aws-s3,@uppy/tus,@uppy/xhr-upload: replace `this.getState().files` with `this.uppy.getState().files` (Artur Paikin / #4167)

## 3.0.2

Released: 2022-09-25
Included in: Uppy v3.1.0

- @uppy/audio,@uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/companion,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/redux-dev-tools,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/svelte,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: add missing entries to changelog for individual packages (Antoine du Hamel / #4092)

## 3.0.0

Released: 2022-08-22
Included in: Uppy v3.0.0

- @uppy/aws-s3,@uppy/tus,@uppy/xhr-upload: @uppy/tus, @uppy/xhr-upload, @uppy/aws-s3: `metaFields` -> `allowedMetaFields` (Merlijn Vos / #4023)
- @uppy/tus: avoid crashing when Tus client reports an error (Antoine du Hamel / #4019)
- @uppy/tus: fix dependencies (Antoine du Hamel / #3923)
- @uppy/tus: add file argument to `onBeforeRequest` (Merlijn Vos / #3984)
- Switch to ESM

## 3.0.0-beta.2

Released: 2022-08-03
Included in: Uppy v3.0.0-beta.4

- @uppy/companion,@uppy/tus: Upgrade tus-js-client to 3.0.0 (Merlijn Vos / #3942)

## 2.4.2

Released: 2022-08-02
Included in: Uppy v2.13.2

- @uppy/tus: fix dependencies (Antoine du Hamel / #3923)

## 2.4.1

Released: 2022-06-07
Included in: Uppy v2.12.0

- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/tus: queue socket token requests for remote files (Merlijn Vos / #3797)
- @uppy/tus: make onShouldRetry type optional (Merlijn Vos / #3800)

## 2.4.0

Released: 2022-05-30
Included in: Uppy v2.11.0

- @uppy/angular,@uppy/audio,@uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/box,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/onedrive,@uppy/progress-bar,@uppy/react,@uppy/redux-dev-tools,@uppy/robodog,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: doc: update bundler recommendation (Antoine du Hamel / #3763)
- @uppy/tus: Add `onShouldRetry` as option to @uppy/tus (Merlijn Vos / #3720)
- @uppy/tus: fix broken import (Antoine du Hamel / #3729)
- @uppy/tus: fixup! @uppy/tus: wait for user promise on beforeRequest (Antoine du Hamel / #3712)
- @uppy/tus: wait for user promise on beforeRequest (Antoine du Hamel / #3712)

## 2.3.0

Released: 2022-05-14
Included in: Uppy v2.10.0

- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/core,@uppy/react,@uppy/transloadit,@uppy/tus,@uppy/xhr-upload: proposal: Cancel assemblies optional (Mikael Finstad / #3575)
- @uppy/tus: refactor to ESM (Antoine du Hamel / #3724)

## 2.2.2

Released: 2022-03-29
Included in: Uppy v2.9.1

- @uppy/tus: fix hasOwn (Mikael Finstad / #3604)

## 2.2.1

Released: 2022-03-24
Included in: Uppy v2.9.0

- @uppy/tus: fix double requests sent when rate limiting (Antoine du Hamel / #3595)

## 2.2.0

Released: 2022-01-10
Included in: Uppy v2.4.0

- @uppy/tus: pause all requests in response to server rate limiting (Antoine du Hamel / #3394)
