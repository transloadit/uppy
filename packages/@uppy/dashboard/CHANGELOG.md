# @uppy/dashboard

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
