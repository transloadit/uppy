# @uppy/aws-s3

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

## 4.2.3

Released: 2025-01-22
Included in: Uppy v4.13.1

- @uppy/aws-s3: Fixed default shouldUseMultipart (Mika Laitinen / #5613)
- @uppy/aws-s3: remove console.error (Mikael Finstad / #5607)

## 4.2.2

Released: 2025-01-15
Included in: Uppy v4.13.0

- @uppy/aws-s3: always set S3 meta to UppyFile & include key (Merlijn Vos / #5602)
- @uppy/aws-s3: allow uploads to fail/succeed independently (Merlijn Vos / #5603)

## 4.2.0

Released: 2025-01-06
Included in: Uppy v4.11.0

- @uppy/angular,@uppy/audio,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive-picker,@uppy/google-drive,@uppy/google-photos-picker,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/vue,@uppy/webcam,@uppy/webdav,@uppy/xhr-upload,@uppy/zoom: Remove "paths" from all tsconfig's (Merlijn Vos / #5572)

## 4.1.3

Released: 2024-12-05
Included in: Uppy v4.8.0

- @uppy/aws-s3: console.error instead of throw for missing etag (Merlijn Vos / #5521)
- @uppy/audio,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: cleanup tsconfig (Mikael Finstad / #5520)

## 4.1.2

Released: 2024-11-11
Included in: Uppy v4.7.0

- @uppy/aws-s3: clarify and warn when incorrect buckets settings are used (Mikael Finstad / #5505)

## 4.1.1

Released: 2024-10-31
Included in: Uppy v4.6.0

- @uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react-native,@uppy/react,@uppy/redux-dev-tools,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/svelte,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: Fix links (Anthony Veaudry / #5492)

## 4.1.0

Released: 2024-08-29
Included in: Uppy v4.3.0

- @uppy/aws-s3,@uppy/box,@uppy/compressor,@uppy/dropbox,@uppy/facebook,@uppy/google-drive,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/onedrive,@uppy/screen-capture,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/xhr-upload,@uppy/zoom: export plugin options (Antoine du Hamel / #5433)

## 4.0.2

Released: 2024-07-30
Included in: Uppy v4.1.0

- @uppy/aws-s3: improve error when `endpoint` is not provided (Antoine du Hamel / #5361)

## 4.0.1

Released: 2024-07-18
Included in: Uppy v4.0.5

- @uppy/aws-s3: use default `Body` generic & export `AwsBody` (Merlijn Vos / #5353)
- @uppy/aws-s3: only send `PartNumber` and `ETag` in completion request (Antoine du Hamel / #5356)

## 4.0.0

Released: 2024-07-10
Included in: Uppy v4.0.0

- @uppy/aws-s3: fix signing on client for bucket name with dots (Antoine du Hamel / #5312)

## 4.0.0-beta.7

Released: 2024-06-18
Included in: Uppy v4.0.0-beta.12

- @uppy/aws-s3: add `endpoint` option (Antoine du Hamel / #5173)

## 4.0.0-beta.5

Released: 2024-06-04
Included in: Uppy v4.0.0-beta.10

- @uppy/aws-s3: remove todo (Mikael Finstad / #5200)
- @uppy/aws-s3: do not expose internal `assertHost` method (Mikael Finstad / #5200)
- @uppy/aws-s3: make passing `signal` consistent (Mikael Finstad / #5200)
- @uppy/aws-s3: remove `chunkState` getter (Mikael Finstad / #5200)
- @uppy/aws-s3: remove `uploaderSockets` (Mikael Finstad / #5200)
- @uppy/aws-s3,@uppy/tus,@uppy/utils,@uppy/xhr-upload: remove `uploader` from `upload-progress` event (Mikael Finstad / #5200)

## 4.0.0-beta.2

Released: 2024-04-11
Included in: Uppy v4.0.0-beta.2

- @uppy/aws-s3: default to multipart depending on the size of input (Antoine du Hamel / #5076)
- @uppy/aws-s3: remove deprecated `prepareUploadParts` option (Antoine du Hamel / #5075)
- @uppy/aws-s3: remove legacy plugin (Antoine du Hamel / #5070)

## 4.0.0-beta.1

Released: 2024-03-28
Included in: Uppy v4.0.0-beta.1

- @uppy/aws-s3-multipart: mark `opts` as optional (Antoine du Hamel / #5039)
- @uppy/aws-s3-multipart,@uppy/tus,@uppy/utils,@uppy/xhr-upload: Make `allowedMetaFields` consistent (Merlijn Vos / #5011)
- @uppy/aws-s3-multipart: refactor to TS (Antoine du Hamel / #4902)
- @uppy/aws-s3-multipart: fix escaping issue with client signed request (Hiroki Shimizu / #5006)

## 3.11.0

Released: 2024-03-27
Included in: Uppy v3.24.0

- @uppy/aws-s3-multipart: mark `opts` as optional (Antoine du Hamel / #5039)
- @uppy/aws-s3-multipart: refactor to TS (Antoine du Hamel / #4902)
- @uppy/aws-s3-multipart: fix escaping issue with client signed request (Hiroki Shimizu / #5006)

## 3.8.0

Released: 2023-10-20
Included in: Uppy v3.18.0

- @uppy/aws-s3-multipart: fix `TypeError` (Antoine du Hamel / #4748)
- @uppy/aws-s3-multipart: pass `signal` as separate arg for backward compat (Antoine du Hamel / #4746)
- @uppy/aws-s3-multipart: fix `uploadURL` when using `PUT` (Antoine du Hamel / #4701)

## 3.7.0

Released: 2023-09-29
Included in: Uppy v3.17.0

- @uppy/aws-s3-multipart: retry signature request (Merlijn Vos / #4691)
- @uppy/aws-s3-multipart: aws-s3-multipart - call `#setCompanionHeaders` in `setOptions` (jur-ng / #4687)

## 3.6.0

Released: 2023-09-05
Included in: Uppy v3.15.0

- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/companion-client,@uppy/core,@uppy/tus,@uppy/utils,@uppy/xhr-upload: Move remote file upload logic into companion-client (Merlijn Vos / #4573)

## 3.5.4

Released: 2023-08-23
Included in: Uppy v3.14.1

- @uppy/aws-s3-multipart: fix types when using deprecated option (Antoine du Hamel / #4634)
- @uppy/aws-s3-multipart,@uppy/aws-s3: allow empty objects for `fields` types (Antoine du Hamel / #4631)

## 3.5.3

Released: 2023-08-15
Included in: Uppy v3.14.0

- @uppy/aws-s3-multipart: pass the `uploadURL` back to the caller (Antoine du Hamel / #4614)
- @uppy/aws-s3,@uppy/aws-s3-multipart: update types (Antoine du Hamel / #4611)
- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/companion,@uppy/transloadit,@uppy/xhr-upload: use uppercase HTTP method names (Antoine du Hamel / #4612)
- @uppy/aws-s3,@uppy/aws-s3-multipart: update types (bdirito / #4576)

## 3.5.2

Released: 2023-07-24
Included in: Uppy v3.13.1

- @uppy/aws-s3-multipart: refresh file before calling user-defined functions (mjlumetta / #4557)

## 3.5.1

Released: 2023-07-20
Included in: Uppy v3.13.0

- @uppy/aws-s3-multipart: fix crash on pause/resume (Merlijn Vos / #4581)
- @uppy/aws-s3-multipart: do not access `globalThis.crypto` on the top-level (Bryan J Swift / #4584)

## 3.5.0

Released: 2023-07-13
Included in: Uppy v3.12.0

- @uppy/aws-s3-multipart: add support for signing on the client (Antoine du Hamel / #4519)
- @uppy/aws-s3-multipart: fix lint warning (Antoine du Hamel / #4569)
- @uppy/aws-s3-multipart: fix support for non-multipart PUT upload (Antoine du Hamel / #4568)

## 3.4.1

Released: 2023-07-06
Included in: Uppy v3.11.0

- @uppy/aws-s3-multipart: increase priority of abort and complete (Stefan Schonert / #4542)
- @uppy/aws-s3-multipart: fix upload retry using an outdated ID (Antoine du Hamel / #4544)
- @uppy/aws-s3-multipart: fix Golden Retriever integration (Antoine du Hamel / #4526)
- @uppy/aws-s3-multipart: add types to internal fields (Antoine du Hamel / #4535)
- @uppy/aws-s3-multipart: fix pause/resume (Antoine du Hamel / #4523)
- @uppy/aws-s3-multipart: fix resume single-chunk multipart uploads (Antoine du Hamel / #4528)
- @uppy/aws-s3-multipart: disable pause/resume for remote uploads in the UI (Artur Paikin / #4500)

## 3.4.0

Released: 2023-06-19
Included in: Uppy v3.10.0

- @uppy/aws-s3-multipart: fix the chunk size calculation (Antoine du Hamel / #4508)
- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/tus,@uppy/utils,@uppy/xhr-upload: When file is removed (or all are canceled), controller.abort queued requests (Artur Paikin / #4504)
- @uppy/aws-s3-multipart,@uppy/tus,@uppy/xhr-upload: Don't close socket while upload is still in progress (Artur Paikin / #4479)
- @uppy/aws-s3-multipart: fix `getUploadParameters` option (Antoine du Hamel / #4465)

## 3.3.0

Released: 2023-05-02
Included in: Uppy v3.9.0

- @uppy/aws-s3-multipart: allowedMetaFields: null means “include all” (Artur Paikin / #4437)
- @uppy/aws-s3-multipart: add `shouldUseMultipart ` option (Antoine du Hamel / #4205)
- @uppy/aws-s3-multipart: make retries more robust (Antoine du Hamel / #4424)

## 3.1.3

Released: 2023-04-04
Included in: Uppy v3.7.0

- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/tus,@uppy/xhr-upload: make sure that we reset serverToken when an upload fails (Mikael Finstad / #4376)
- @uppy/aws-s3-multipart: do not auto-open sockets, clean them up on abort (Antoine du Hamel)

## 3.1.2

Released: 2023-01-26
Included in: Uppy v3.4.0

- @uppy/aws-s3-multipart: fix metadata shape (Antoine du Hamel / #4267)
- @uppy/aws-s3-multipart: add support for `allowedMetaFields` option (Antoine du Hamel / #4215)
- @uppy/aws-s3-multipart: fix singPart type (Stefan Schonert / #4224)

## 3.1.1

Released: 2022-11-16
Included in: Uppy v3.3.1

- @uppy/aws-s3-multipart: handle slow connections better (Antoine du Hamel / #4213)
- @uppy/aws-s3-multipart: Fix typo in url check (Christian Franke / #4211)

## 3.1.0

Released: 2022-11-10
Included in: Uppy v3.3.0

- @uppy/aws-s3-multipart: empty the queue when pausing (Antoine du Hamel / #4203)
- @uppy/aws-s3-multipart: refactor rate limiting approach (Antoine du Hamel / #4187)
- @uppy/aws-s3-multipart: change limit to 6 (Antoine du Hamel / #4199)
- @uppy/aws-s3-multipart: remove unused `timeout` option (Antoine du Hamel / #4186)
- @uppy/aws-s3-multipart,@uppy/tus: fix `Timed out waiting for socket` (Antoine du Hamel / #4177)

## 3.0.2

Released: 2022-09-25
Included in: Uppy v3.1.0

- @uppy/audio,@uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/companion,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/redux-dev-tools,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/svelte,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: add missing entries to changelog for individual packages (Antoine du Hamel / #4092)

## 3.0.0

Released: 2022-08-22
Included in: Uppy v3.0.0

- Switch to ESM

## 3.0.0-beta.4

Released: 2022-08-16
Included in: Uppy v3.0.0-beta.5

- @uppy/aws-s3-multipart: Fix when using Companion (Merlijn Vos / #3969)
- @uppy/aws-s3-multipart: Fix race condition in `#uploadParts` (Morgan Zolob / #3955)
- @uppy/aws-s3-multipart: ignore exception inside `abortMultipartUpload` (Antoine du Hamel / #3950)

## 3.0.0-beta.3

Released: 2022-08-03
Included in: Uppy v3.0.0-beta.4

- @uppy/aws-s3-multipart: Correctly handle errors for `prepareUploadParts` (Merlijn Vos / #3912)

## 3.0.0-beta.2

Released: 2022-07-27
Included in: Uppy v3.0.0-beta.3

- @uppy/aws-s3-multipart: make `headers` part indexed too in `prepareUploadParts` (Merlijn Vos / #3895)

## 2.4.1

Released: 2022-06-07
Included in: Uppy v2.12.0

- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/tus: queue socket token requests for remote files (Merlijn Vos / #3797)
- @uppy/aws-s3-multipart: allow `companionHeaders` to be modified with `setOptions` (Paulo Lemos Neto / #3770)

## 2.4.0

Released: 2022-05-30
Included in: Uppy v2.11.0

- @uppy/angular,@uppy/audio,@uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/box,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/onedrive,@uppy/progress-bar,@uppy/react,@uppy/redux-dev-tools,@uppy/robodog,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: doc: update bundler recommendation (Antoine du Hamel / #3763)
- @uppy/aws-s3-multipart: refactor to ESM (Antoine du Hamel / #3672)

## 2.3.0

Released: 2022-05-14
Included in: Uppy v2.10.0

- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/core,@uppy/react,@uppy/transloadit,@uppy/tus,@uppy/xhr-upload: proposal: Cancel assemblies optional (Mikael Finstad / #3575)
- @uppy/aws-s3-multipart: export interface AwsS3MultipartOptions (Matteo Padovano / #3709)

## 2.2.2

Released: 2022-04-27
Included in: Uppy v2.9.4

- @uppy/aws-s3-multipart: Add `companionCookiesRule` type to @uppy/aws-s3-multipart (Mauricio Ribeiro / #3623)

## 2.2.1

Released: 2022-03-02
Included in: Uppy v2.7.0

- @uppy/aws-s3-multipart: Add chunks back to prepareUploadParts, indexed by partNumber (Kevin West / #3520)

## 2.2.0

Released: 2021-12-07
Included in: Uppy v2.3.0

- @uppy/aws-s3-multipart: Drop `lockedCandidatesForBatch` and mark chunks as 'busy' when preparing (Yegor Yarko / #3342)
