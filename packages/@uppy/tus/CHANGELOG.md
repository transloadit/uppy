# @uppy/tus

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
