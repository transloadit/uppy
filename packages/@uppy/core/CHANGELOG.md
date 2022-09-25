# @uppy/core

## 2.3.4

Released: 2022-09-25
Included in: Uppy v2.13.6

- @uppy/core: Fix `Restrictor` counts ghost files against `maxNumberOfFiles` (Andrew McIntee / #4078)
- @uppy/core: fix types (Antoine du Hamel / #4072)
- @uppy/core,@uppy/dashboard,@uppy/thumbnail-generator: update definition type files for TS 4.8 compatibility (Antoine du Hamel / #4055)

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
