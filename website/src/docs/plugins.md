---
title: "List & Common Options"
type: docs
permalink: docs/plugins/
order: 10
---

Plugins are what makes Uppy useful: they help select, manipulate and upload files.

- **Acquirers (various ways of picking files):**
  - [Dashboard](/docs/dashboard) — full-featured sleek UI with file previews, metadata editing, upload/pause/resume/cancel buttons and more. Includes `StatusBar` and `Informer` plugins by default
  - [DragDrop](/docs/dragdrop) — plain and simple drag-and-drop area
  - [FileInput](/docs/fileinput) — even more plain and simple, just a button
  - [Webcam](/docs/webcam) — upload selfies or audio / video recordings
  - [Provider Plugins](/docs/providers) (remote sources that work through [Uppy Server](/docs/uppy-server/))
    - [Dropbox](/docs/dropbox) – import files from Dropbox
    - [GoogleDrive](/docs/google-drive) – import files from Google Drive
    - [Instagram](/docs/instagram) – import files from Instagram
    - [Url](/docs/url) – import files from any public URL
- **Uploaders:**
  - [Tus](/docs/tus) — uploads using the [tus](https://tus.io) resumable upload protocol
  - [XHRUpload](/docs/xhrupload) — classic multipart form uploads or binary uploads using XMLHTTPRequest
  - [AwsS3](/docs/aws-s3) — uploader for AWS S3
- **Progress:**
  - [ProgressBar](/docs/progressbar) — add a small YouTube-style progress bar at the top of the page
  - [StatusBar](/docs/statusbar) — advanced upload progress status bar
  - [Informer](/docs/informer) — show notifications
- **Helpers:**
  - [GoldenRetriever](/docs/golden-retriever) — restore files and continue uploading after a page refresh or a browser crash
  - [Form](/docs/form) — collect metadata from `<form>` right before the Uppy upload, then optionally append results back to the form
- **Encoding Services:**
  - [Transloadit](/docs/transloadit) — manipulate and transcode uploaded files using the [transloadit.com](https://transloadit.com) service

## Common options

Each plugin can have any number of options (please see specific plugins for details), but these are shared between some:

### `id`

A unique string identifying the plugin. By default, the plugin's name is used, so usually it does not need to be configured manually. Use this if you need to add multiple plugins of the same type.

### `target`

Can be a `string` CSS selector, a DOM element, or a Plugin class. Consider the following example, where `DragDrop` plugin will be rendered into a `body` element:

```js
const Uppy = require('uppy/lib/core')
const DragDrop = require('uppy/lib/plugins/DragDrop')
const uppy = Uppy()
uppy.use(DragDrop, { target: 'body' })
// or: uppy.use(DragDrop, { target: document.body })
```

While in this one, we are using the `Dashboard` plugin, which can act as a host target for other plugins:

```js
const Uppy = require('uppy/lib/core')
const DragDrop = require('uppy/lib/plugins/Dashboard')
const GoogleDrive = require('uppy/lib/plugins/GoogleDrive')
const uppy = Uppy()
uppy.use(Dashboard, {
  trigger: '#uppyModalOpener'
})
uppy.use(GoogleDrive, {target: Dashboard})
```

In the example above, the `Dashboard` gets rendered into an element with ID `uppy`, while `GoogleDrive` is rendered into the `Dashboard` itself.

### `locale: {}`

Same as with Uppy.Core’s setting above, this allows you to override plugin’s locale string, so that instead of `Select files` in English, your users will see `Выберите файлы` in Russian. Example:

```js
.use(FileInput, {
  target: 'body',
  locale: {
    strings: { selectToUpload: 'Выберите файл для загрузки' }
  }
})
```

See plugin documentation pages for other plugin-specific options.

## Provider Plugins

See the [Provider Plugins](/docs/providers) documentation page for information on provider plugins.
