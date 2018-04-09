---
title: "List & Common Options"
type: docs
permalink: docs/plugins/
order: 10
---

Plugins are what makes Uppy useful: they help select, manipulate and upload files.

- **Acquirers (various ways of picking files):**
  - [Dashboard](/docs/dashboard) — full featured sleek UI with file previews, metadata editing, upload/pause/resume/cancel buttons and more. Includes `StatusBar` and `Informer` plugins by default
  - [DragDrop](/docs/dragdrop) — plain and simple drag and drop area
  - [FileInput](/docs/fileinput) — even more plain and simple, just a button
  - [Provider Plugins](#Provider-Plugins) (remote sources that work through [Uppy Server](/docs/uppy-server/)): Instagram, GoogleDrive, Dropbox, Url (direct link)
  - [Webcam](/docs/webcam) — upload selfies or audio / video recordings
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
  - [Form](/docs/form) — collect metadata from `<form>` right before Uppy upload, then optionally append results back to the form
- **Encoding Services:**
  - [Transloadit](/docs/transloadit) — manipulate and transcode uploaded files using the [transloadit.com](https://transloadit.com) service

## Common Options

Each plugin can have any number of options (please see specific plugin for details), but these are shared between some:

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

In the example above the `Dashboard` gets rendered into an element with ID `uppy`, while `GoogleDrive` is rendered into the `Dashboard` itself.

### `endpoint`

Used by uploader plugins, such as [Tus](/docs/tus) and [XHRUpload](/docs/xhrupload). Expects a `string` with a url that will be used for file uploading.

### `host`

Used by remote provider plugins, such as Google Drive, Instagram or Dropbox. Specifies the url to your running `uppy-server`. This allows uppy to know what server to connect to when server related operations are required by the provider plugin.

```js
// for Google Drive
const GoogleDrive = require('uppy/lib/plugins/GoogleDrive')
uppy.use(GoogleDrive, {target: Dashboard, host: 'http://localhost:3020'})
```

### `replaceTargetContent: false`

By default Uppy will append any UI to a DOM element, if such element is specified as a `target`. This default is the least dangerous option. However, there might be cases when you’d want to clear the container element before placing Uppy UI in there (for example, to provide a fallback `<form>` that will be shown if Uppy or JavaScript is not loaded/supported on the page). Set `replaceTargetContent: true` to clear the `target` before appending.

### `locale: {}`

Same as with Uppy.Core’s setting from above, this allows you to override plugin’s locale string, so that instead of `Select files` in English, your users will see `Выберите файлы` in Russian. Example:

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

The Provider plugins help you connect to your accounts with remote file providers such as [Dropbox](https://dropbox.com), [Google Drive](https://drive.google.com), [Instagram](https://instagram.com) and remote urls (import a file by pasting a direct link to it). Because this requires server to server communication, they work tightly with [uppy-server](https://github.com/transloadit/uppy-server) to manage the server to server authorization for your account. Virtually most of the communication (file download/upload) is done on the server-to-server end, so this saves you the stress of data consumption on the client.

As of now, the supported providers are **Dropbox**, **GoogleDrive**, **Instagram**, and **Url**.

Usage of the Provider plugins is not that different from any other *acquirer* plugin, except that it takes an extra option `host`, which specifies the url to your running `uppy-server`. This allows Uppy to know what server to connect to when server related operations are required by the provider plugin. Here's a quick example.

```js
const Uppy = require('uppy/lib/core')
const Dashboard = require('uppy/lib/plugins/Dashboard')
const uppy = Uppy()
uppy.use(Dashboard, {
  trigger: '#pick-files'
})

// for Google Drive
const GoogleDrive = require('uppy/lib/plugins/GoogleDrive')
uppy.use(GoogleDrive, {target: Dashboard, host: 'http://localhost:3020'})

// for Dropbox
const Dropbox = require('uppy/lib/plugins/Dropbox')
uppy.use(Dropbox, {target: Dashboard, host: 'http://localhost:3020'})

// for Instagram
const Instagram = require('uppy/lib/plugins/Instagram')
uppy.use(Instagram, {target: Dashboard, host: 'http://localhost:3020'})

// for Url
const Url = require('uppy/lib/plugins/Url')
uppy.use(Url, {target: Dashboard, host: 'http://localhost:3020'})
```
