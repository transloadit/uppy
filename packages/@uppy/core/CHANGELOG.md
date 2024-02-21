# @uppy/core

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
