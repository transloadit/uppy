# @uppy/aws-s3

## 3.6.1

Released: 2024-02-19
Included in: Uppy v3.22.0

-  @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/companion-client,@uppy/tus,@uppy/xhr-upload: update `uppyfile` objects before emitting events (antoine du hamel / #4928)

## 3.6.0

Released: 2023-12-12
Included in: Uppy v3.21.0

- @uppy/aws-s3: change Companion URL in tests (Antoine du Hamel)

## 3.3.0

Released: 2023-09-05
Included in: Uppy v3.15.0

- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/companion-client,@uppy/core,@uppy/tus,@uppy/utils,@uppy/xhr-upload: Move remote file upload logic into companion-client (Merlijn Vos / #4573)

## 3.2.3

Released: 2023-08-23
Included in: Uppy v3.14.1

- @uppy/aws-s3-multipart,@uppy/aws-s3: allow empty objects for `fields` types (Antoine du Hamel / #4631)

## 3.2.2

Released: 2023-08-15
Included in: Uppy v3.14.0

- @uppy/aws-s3,@uppy/aws-s3-multipart: update types (Antoine du Hamel / #4611)
- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/companion,@uppy/transloadit,@uppy/xhr-upload: use uppercase HTTP method names (Antoine du Hamel / #4612)
- @uppy/aws-s3,@uppy/aws-s3-multipart: update types (bdirito / #4576)
- @uppy/aws-s3,@uppy/tus,@uppy/xhr-upload:  Invoke headers function for remote uploads (Dominik Schmidt / #4596)

## 3.2.1

Released: 2023-07-06
Included in: Uppy v3.11.0

- @uppy/aws-s3: fix remote uploads (Antoine du Hamel / #4546)

## 3.2.0

Released: 2023-06-19
Included in: Uppy v3.10.0

- @uppy/aws-s3: add `shouldUseMultipart` option (Antoine du Hamel / #4299)
- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/tus,@uppy/utils,@uppy/xhr-upload: When file is removed (or all are canceled), controller.abort queued requests (Artur Paikin / #4504)

## 3.1.1

Released: 2023-05-02
Included in: Uppy v3.9.0

- @uppy/aws-s3: deprecate `timeout` option (Antoine du Hamel / #4298)

## 3.0.6

Released: 2023-04-04
Included in: Uppy v3.7.0

- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/tus,@uppy/xhr-upload: make sure that we reset serverToken when an upload fails (Mikael Finstad / #4376)
- @uppy/aws-s3: Update types (Minh Hieu / #4294)

## 3.0.5

Released: 2023-01-26
Included in: Uppy v3.4.0

- @uppy/aws-s3: fix: add https:// to digital oceans link (Le Gia Hoang / #4165)

## 3.0.4

Released: 2022-10-24
Included in: Uppy v3.2.2

- @uppy/aws-s3,@uppy/tus,@uppy/xhr-upload: replace `this.getState().files` with `this.uppy.getState().files` (Artur Paikin / #4167)

## 3.0.3

Released: 2022-10-19
Included in: Uppy v3.2.0

- @uppy/aws-s3,@uppy/xhr-upload: fix `Cannot mark a queued request as done` in `MiniXHRUpload` (Antoine du Hamel / #4151)

## 3.0.2

Released: 2022-09-25
Included in: Uppy v3.1.0

- @uppy/audio,@uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/companion,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/redux-dev-tools,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/svelte,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: add missing entries to changelog for individual packages (Antoine du Hamel / #4092)

## 3.0.0

Released: 2022-08-22
Included in: Uppy v3.0.0

- @uppy/aws-s3,@uppy/tus,@uppy/xhr-upload: @uppy/tus, @uppy/xhr-upload, @uppy/aws-s3: `metaFields` -> `allowedMetaFields` (Merlijn Vos / #4023)
- @uppy/aws-s3: aws-s3: fix incorrect comparison for `file-removed` (Merlijn Vos / #3962)
- Switch to ESM

## 3.0.0-beta.3

Released: 2022-08-16
Included in: Uppy v3.0.0-beta.5

- @uppy/aws-s3: Export AwsS3UploadParameters & AwsS3Options interfaces (Antonina Vertsinskaya / #3956)

## 3.0.0-beta.2

Released: 2022-07-27
Included in: Uppy v3.0.0-beta.3

- @uppy/aws-s3,@uppy/core,@uppy/dashboard,@uppy/store-redux,@uppy/xhr-upload: upgrade `nanoid` to v4 (Antoine du Hamel / #3904)

## 2.2.1

Released: 2022-06-07
Included in: Uppy v2.12.0

- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/tus: queue socket token requests for remote files (Merlijn Vos / #3797)

## 2.2.0

Released: 2022-05-30
Included in: Uppy v2.11.0

- @uppy/angular,@uppy/audio,@uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/box,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/onedrive,@uppy/progress-bar,@uppy/react,@uppy/redux-dev-tools,@uppy/robodog,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: doc: update bundler recommendation (Antoine du Hamel / #3763)
- @uppy/aws-s3: fix JSDoc type error (Antoine du Hamel / #3785)
- @uppy/aws-s3: refactor to ESM (Antoine du Hamel / #3673)

## 2.1.0

Released: 2022-05-14
Included in: Uppy v2.10.0

- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/core,@uppy/react,@uppy/transloadit,@uppy/tus,@uppy/xhr-upload: proposal: Cancel assemblies optional (Mikael Finstad / #3575)

## 2.0.9

Released: 2022-04-07
Included in: Uppy v2.9.2

- @uppy/aws-s3,@uppy/companion-client,@uppy/transloadit,@uppy/utils: Propagate `isNetworkError` through error wrappers (Renée Kooi / #3620)

## 2.0.8

Released: 2022-03-16
Included in: Uppy v2.8.0

- @uppy/aws-s3: fix wrong events being sent to companion (Mikael Finstad / #3576)

## 2.0.7

Released: 2021-12-09
Included in: Uppy v2.3.1

- @uppy/aws-s3,@uppy/core,@uppy/dashboard,@uppy/store-redux,@uppy/xhr-upload: deps: use `nanoid/non-secure` to workaround react-native limitation (Antoine du Hamel / #3350)

## 2.0.6

Released: 2021-12-07
Included in: Uppy v2.3.0

- @uppy/aws-s3,@uppy/box,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/google-drive,@uppy/image-editor,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/screen-capture,@uppy/status-bar,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/url,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: Refactor locale scripts & generate types and docs (Merlijn Vos / #3276)
