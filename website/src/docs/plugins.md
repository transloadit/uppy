---
title: "List & Common Options"
type: docs
permalink: docs/plugins/
order: 0
category: 'Plugins'
---

Plugins are what makes Uppy useful: they help select, manipulate and upload files.

- **Local Sources:**
  - [@uppy/dashboard](/docs/dashboard) — full-featured sleek UI with file previews, metadata editing, upload/pause/resume/cancel buttons and more. Includes `StatusBar` and `Informer` plugins by default
  - [@uppy/drag-drop](/docs/drag-drop) — plain and simple drag-and-drop area
  - [@uppy/file-input](/docs/file-input) — even more plain and simple, just a button
  - [@uppy/webcam](/docs/webcam) — upload selfies or audio / video recordings
- **[Remote Providers](/docs/providers):** (remote sources that work through [Companion](/docs/companion/))
  - [@uppy/dropbox](/docs/dropbox) – import files from Dropbox
  - [@uppy/google-drive](/docs/google-drive) – import files from Google Drive
  - [@uppy/instagram](/docs/instagram) – import files from Instagram
  - [@uppy/url](/docs/url) – import files from any public URL
- **Uploaders:**
  - [@uppy/tus](/docs/tus) — uploads using the [tus](https://tus.io) resumable upload protocol
  - [@uppy/xhr-upload](/docs/xhr-upload) — classic multipart form uploads or binary uploads using XMLHTTPRequest
  - [@uppy/aws-s3](/docs/aws-s3) — uploader for AWS S3
  - [@uppy/aws-s3-multipart](/docs/aws-s3-multipart) — uploader for AWS S3 using its resumable Multipart protocol
- **UI Elements:**
  - [@uppy/progress-bar](/docs/progress-bar) — add a small YouTube-style progress bar at the top of the page
  - [@uppy/status-bar](/docs/status-bar) — advanced upload progress status bar
  - [@uppy/informer](/docs/informer) — show notifications
- **Encoding Services:**
  - [@uppy/transloadit](/docs/transloadit) — manipulate and transcode uploaded files using the [transloadit.com](https://transloadit.com) service
- **Miscellaneous:**
  - [@uppy/form](/docs/form) — collect metadata from `<form>` right before the Uppy upload, then optionally append results back to the form
  <!-- TODO document? -->
  - @uppy/thumbnail-generator — generate preview thumbnails for images to be uploaded [documentation not yet available]
  - [@uppy/golden-retriever](/docs/golden-retriever) — restore files and continue uploading after a page refresh or a browser crash

## Common options

Each plugin can have any number of options (please see specific plugins for details), but these are shared between some:

### `id`

A unique string identifying the plugin. By default, the plugin's name is used, so usually it does not need to be configured manually. Use this if you need to add multiple plugins of the same type.

### `target`

Can be a `string` CSS selector, a DOM element, or a Plugin class. Consider the following example, where `DragDrop` plugin will be rendered into a `body` element:

```js
const Uppy = require('@uppy/core')
const DragDrop = require('@uppy/drag-drop')
const uppy = Uppy()
uppy.use(DragDrop, { target: 'body' })
// or: uppy.use(DragDrop, { target: document.body })
```

While in this one, we are using the `@uppy/dashboard` plugin, which can act as a host target for other plugins:

```js
const Uppy = require('@uppy/core')
const Dashboard = require('@uppy/dashboard')
const GoogleDrive = require('@uppy/google-drive')
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

<!-- Keep this heading, it is here to avoid breaking existing URLs -->
<!-- Previously the content that is now at /docs/providers was here -->
## Provider Plugins

See the [Provider Plugins](/docs/providers) documentation page for information on provider plugins.
