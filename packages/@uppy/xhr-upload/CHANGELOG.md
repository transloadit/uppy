# @uppy/xhr-upload

## 3.6.4

Released: 2024-02-28
Included in: Uppy v3.23.0

- @uppy/companion-client,@uppy/utils,@uppy/xhr-upload: improvements for #4922 (Mikael Finstad / #4960)
- @uppy/xhr-upload: fix getResponseData regression (Merlijn Vos / #4964)

## 3.6.1

Released: 2024-02-19
Included in: Uppy v3.22.0

-  @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/companion-client,@uppy/tus,@uppy/xhr-upload: update `uppyfile` objects before emitting events (antoine du hamel / #4928)
- @uppy/xhr-upload: migrate to ts (merlijn vos / #4892)
- @uppy/xhr-upload: show remove button (merlijn vos / #4851)

## 3.4.0

Released: 2023-09-05
Included in: Uppy v3.15.0

- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/companion-client,@uppy/core,@uppy/tus,@uppy/utils,@uppy/xhr-upload: Move remote file upload logic into companion-client (Merlijn Vos / #4573)

## 3.3.2

Released: 2023-08-15
Included in: Uppy v3.14.0

- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/companion,@uppy/transloadit,@uppy/xhr-upload: use uppercase HTTP method names (Antoine du Hamel / #4612)
- @uppy/aws-s3,@uppy/tus,@uppy/xhr-upload:  Invoke headers function for remote uploads (Dominik Schmidt / #4596)

## 3.3.1

Released: 2023-07-06
Included in: Uppy v3.11.0

- @uppy/xhr-upload: export `Headers` type (Masum ULU / #4549)

## 3.3.0

Released: 2023-06-19
Included in: Uppy v3.10.0

- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/tus,@uppy/utils,@uppy/xhr-upload: When file is removed (or all are canceled), controller.abort queued requests (Artur Paikin / #4504)
- @uppy/aws-s3-multipart,@uppy/tus,@uppy/xhr-upload: Don't close socket while upload is still in progress (Artur Paikin / #4479)
- @uppy/xhr-upload: add support for arrays in metadata (Vasiliy Matyushin / #4431)

## 3.2.0

Released: 2023-04-18
Included in: Uppy v3.8.0

- @uppy/xhr-upload: fix type in README.md (Top Master / #4416)

## 3.1.1

Released: 2023-04-04
Included in: Uppy v3.7.0

- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/tus,@uppy/xhr-upload: make sure that we reset serverToken when an upload fails (Mikael Finstad / #4376)

## 3.1.0

Released: 2023-02-13
Included in: Uppy v3.5.0

- @uppy/xhr-upload: add `'upload-stalled'` event (Antoine du Hamel / #4247)

## 3.0.4

Released: 2022-10-24
Included in: Uppy v3.2.2

- @uppy/aws-s3,@uppy/tus,@uppy/xhr-upload: replace `this.getState().files` with `this.uppy.getState().files` (Artur Paikin / #4167)

## 3.0.3

Released: 2022-10-19
Included in: Uppy v3.2.0

- @uppy/xhr-upload: fix `Timed out waiting for socket` (Antoine du Hamel / #4150)
- @uppy/aws-s3,@uppy/xhr-upload: fix `Cannot mark a queued request as done` in `MiniXHRUpload` (Antoine du Hamel / #4151)
- @uppy/xhr-upload: queue requests for socket token for remote files (Daniel Jones / #4123)

## 3.0.2

Released: 2022-09-25
Included in: Uppy v3.1.0

- @uppy/audio,@uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/companion,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/redux-dev-tools,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/svelte,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: add missing entries to changelog for individual packages (Antoine du Hamel / #4092)

## 3.0.0

Released: 2022-08-22
Included in: Uppy v3.0.0

- @uppy/aws-s3,@uppy/tus,@uppy/xhr-upload: @uppy/tus, @uppy/xhr-upload, @uppy/aws-s3: `metaFields` -> `allowedMetaFields` (Merlijn Vos / #4023)
- Switch to ESM

## 3.0.0-beta.2

Released: 2022-07-27
Included in: Uppy v3.0.0-beta.3

- @uppy/aws-s3,@uppy/core,@uppy/dashboard,@uppy/store-redux,@uppy/xhr-upload: upgrade `nanoid` to v4 (Antoine du Hamel / #3904)

## 2.1.2

Released: 2022-06-07
Included in: Uppy v2.12.0

- @uppy/xhr-upload: replace `ev.target.status` with `xhr.status` (Wes Sankey / #3782)

## 2.1.1

Released: 2022-05-30
Included in: Uppy v2.11.0

- @uppy/angular,@uppy/audio,@uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/box,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/onedrive,@uppy/progress-bar,@uppy/react,@uppy/redux-dev-tools,@uppy/robodog,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: doc: update bundler recommendation (Antoine du Hamel / #3763)

## 2.1.0

Released: 2022-05-14
Included in: Uppy v2.10.0

- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/core,@uppy/react,@uppy/transloadit,@uppy/tus,@uppy/xhr-upload: proposal: Cancel assemblies optional (Mikael Finstad / #3575)
- @uppy/xhr-upload: refactor to ESM (Antoine du Hamel / #3695)

## 2.0.7

Released: 2021-12-09
Included in: Uppy v2.3.1

- @uppy/aws-s3,@uppy/core,@uppy/dashboard,@uppy/store-redux,@uppy/xhr-upload: deps: use `nanoid/non-secure` to workaround react-native limitation (Antoine du Hamel / #3350)

## 2.0.6

Released: 2021-12-07
Included in: Uppy v2.3.0

- @uppy/aws-s3,@uppy/box,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/google-drive,@uppy/image-editor,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/screen-capture,@uppy/status-bar,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/url,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: Refactor locale scripts & generate types and docs (Merlijn Vos / #3276)
