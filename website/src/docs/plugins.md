---
title: "Plugins"
type: docs
permalink: docs/plugins
order: 2
---

Plugins are what make Uppy useful, they help select, manipulate and upload files.

**Acquirers**
- Dashboard
- DragDrop
- FileInput
- Provider Plugins
  - Instagram
  - GoogleDrive
  - Dropbox

**Uploaders**
- Tus
- XHRUpload
- S3

**Progress**


**Helpers**
- GoldenRetriever

## Common Options

Each plugin can have any number of options, but these are shared between some:

### `target`

Can be a `string` or an `object`, referencing another plugin. Consider the following example, where `DragDrop` plugin will be rendered to `body` element:

```js
const Uppy = require('uppy/lib/core')
const DragDrop = require('uppy/lib/plugins/DragDrop')
const uppy = Uppy()
uppy.use(DragDrop, {target: 'body'})
```

While in this one, we are using the `Dashboard` plugin, which can act as a host target for other plugins:

```js
const Uppy = require('uppy/lib/core')
const DragDrop = require('uppy/lib/plugins/Dashboard')
const GoogleDrive = require('uppy/lib/plugins/GoogleDrive')
const uppy = Uppy()
uppy.use(Dashboard, {
  trigger: '#uppyModalOpener',
  target: '#uppy',
})
uppy.use(GoogleDrive, {target: Dashboard})
```

In the example above the `Dashboard` gets rendered into an element with ID `uppy`, while `GoogleDrive` is rendered into the `Dashboard` itself.

### `endpoint`

Used by uploader plugins, such as Tus and XHRUpload. Expects a `string` with a url that will be used for file uploading.

### `setMetaFromTargetForm`

If `setMetaFromTargetForm === true`, UI acquire type plugins, like Dashboard, FileInput and DragDrop, before mounting themselves or doing anything else, will extract FormData
from the target `<form>` element (it must be a form currently), and merge the object with the global `uppy.state.meta`.

If you have a form like this one:

```html
<form class="MyForm" action="/">
  <input type="file" />
  <input type="hidden" name="bla" value="12333">
  <input type="text" name="yo" value="1">
  <button type="submit">Upload</button>
</form>
```

And then do:

```js
uppy.use(DragDrop, {
  target: '.MyForm',
  setMetaFromTargetForm: true
})
```

Uppy’s `uppy.state.meta` will become:

```js
state = {
  meta: {
    bla: 12333,
    yo: 1
  }
}
```

### `locale`

Same as with Uppy.Core’s setting from above, this allows you to override plugin’s local string, so that instead of `Select files` in English, your users will see `Выберите файлы` in Russian. Example:

```js
.use(FileInput, {
  target: 'body', 
  locale: {
    strings: { selectToUpload: 'Выберите файл для загрузки' }
  }
})
```

See plugin documentation below for other plugin-specific options.

## Dashboard

## Webcam

## Tus

## XHRUpload

## Provider Plugins

The Provider plugins help you connect to your accounts with remote file providers such as [Dropbox](https://dropbox.com),
[Google Drive](https://drive.google.com), [Instagram](https://instagram.com). Because this requires server to server communication, they work tightly with
[uppy-server](https://github.com/transloadit/uppy-server) to manage the server to server authroization for your account. Virtually most of the communication(file download/upload) is done on the server-to-server end, so this saves you the stress of data consumption.

As of now the supported providers are **Dropbox**, **GoogleDrive**, and **Instagram**.

Usage of the Provider plugins is not so different from any other *acquirer* plugin, except that it takes an extra option `host`, which specifies the url to your running `uppy-server`. This allows uppy to know what server to connect to when server related operations are required by the provider plugin. Here's a quick example.

```js
const Uppy = require('uppy/lib/core')
const DragDrop = require('uppy/lib/plugins/Dashboard')
const uppy = Uppy()
uppy.use(Dashboard, {
  trigger: '#uppyModalOpener',
  target: '#uppy',
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
```
