---
type: docs
title: "How To Make A Plugin"
permalink: docs/how-to-plugin/
order: 20
---

<link rel="stylesheet" href="https://uppy.io/css/main.css">

There are a few useful Uppy plugins out there, but there might come a time when you’ll want to build your own.
Plugins can hook into the upload process or render a custom UI, typically to:

 - Render some custom UI element, e.g. [StatusBar](/docs/statusbar) or [Dashboard](/docs/dashboard).
 - Do the actual uploading, e.g. [XHRUpload](/docs/xhrupload) or [Tus](/docs/tus).
 - Interact with a third party service to process uploads correctly, e.g. [Transloadit](/docs/transloadit) or [AwsS3](/docs/aws-s3).

## Creating A Plugin

Plugins are classes that extend from Uppy's `Plugin` class. Each plugin has an `id` and a `type`. `id`s are used to uniquely identify plugins. A `type` can be anything—some plugins use `type`s to determine whether to do something to some other plugin. For example, when targeting plugins at the builtin `Dashboard` plugin, the Dashboard uses the `type` to figure out where to mount different UI elements. `'acquirer'` type plugins are mounted into the tab bar, while `'progressindicator'` type plugins are mounted into the progress bar area.

The plugin constructor receives the Uppy instance in the first parameter, and any options passed to `uppy.use()` in the second parameter.

```js
const Plugin = require('uppy/lib/plugins/Plugin')
module.exports = class MyPlugin extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = opts.id || 'MyPlugin'
    this.type = 'example'
  }
}
```

## Methods

Plugins can implement methods in order to execute certain tasks. The most important method is `install()`, which is called when a plugin is `.use`d.

All of the below methods are optional! Only implement the methods you need.

### `install()`

Called when the plugin is `.use`d. Do any setup work here, like attaching events or adding [upload hooks](#Upload-Hooks).

```js
install () {
  this.uppy.on('upload-progress', this.onProgress)
  this.uppy.addPostProcessor(this.afterUpload)
}
```

### `uninstall()`

Called when the plugin is removed, or the Uppy instance is closed. This should undo all of the work done in the `install()` method.

```js
uninstall () {
  this.uppy.off('upload-progress', this.onProgress)
  this.uppy.removePostProcessor(this.afterUpload)
}
```

### `update(state)`

Called on each state update. For UI plugins, this is a good time to rerender!

### `mount(target)`

> UI plugins only.

### `render()`

> UI plugins only.

## Upload Hooks

When creating an upload, Uppy runs files through an upload pipeline. The pipeline consists of three parts, each of which can be hooked into: Preprocessing, Uploading, and Postprocessing. Preprocessors can be used to configure uploader plugins, encrypt files, resize images, etc., before uploading them. Uploaders do the actual uploading work, such as creating an XMLHttpRequest object and sending the file. Postprocessors do work after files have been uploaded completely. This could be anything from waiting for a file to propagate across a CDN, to sending another request to relate some metadata to the file.

Each hook is a function that receives an array containing the file IDs that are being uploaded, and returns a Promise to signal completion. Hooks are added and removed through `Uppy` methods: `addPreProcessor`, `addUploader`, `addPostProcessor`, and their `remove*` counterparts. Normally, hooks should be added during the plugin's `install()` method, and removed during the `uninstall()` method.

Additionally, upload hooks can fire events to signal progress.

When adding hooks, make sure to bind the hook `fn` beforehand! Otherwise it will be impossible to remove. For example:

```js
class MyPlugin extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = opts.id || 'MyPlugin'
    this.type = 'example'
    this.prepareUpload = this.prepareUpload.bind(this) // ← this!
  }

  prepareUpload (fileIDs) {
    return Promise.resolve()
  }

  install () {
    this.uppy.addPreProcessor(this.prepareUpload)
  }

  uninstall () {
    this.uppy.removePreProcessor(this.prepareUpload)
  }
}
```

### `addPreProcessor(fn)`

Add a preprocessing function. `fn` gets called with a list of file IDs before an upload starts. `fn` should return a Promise. Its resolution value is ignored. To change file data and such, use Uppy state updates, for example using [`setFileState`][core.setfilestate].

### `addUploader(fn)`

Add an uploader function. `fn` gets called with a list of file IDs when an upload should start. Uploader functions should do the actual uploading work, such as creating and sending an XMLHttpRequest or calling into some upload service's SDK. `fn` should return a Promise that resolves once all files have been uploaded.

You may choose to still resolve the Promise if some file uploads fail. This way any postprocessing will still run on the files that were uploaded successfully, while uploads that failed will be retried when `uppy.retryAll` is called.

### `addPostProcessor(fn)`

Add a postprocessing function. `fn` is called with a list of file IDs when an upload has finished. `fn` should return a Promise that resolves when the processing work is complete. Again, the resolution value of the Promise is ignored. This hook can be used to do any finishing work. For example, you could wait for file encoding or CDN propagation to complete, or you could do an HTTP API call to create an album containing all images that were just uploaded.

### `removePreProcessor/removeUploader/removePostProcessor(fn)`

Remove a processor or uploader function that was added previously. Normally this should be done in the `uninstall()` method.

## Progress Events

Progress events can be fired for individual files to show feedback to the user. For upload progress events, only emitting how many bytes are expected and how many have been uploaded is enough. Uppy will handle calculating progress percentages, upload speed, etc.

Preprocessing and postprocessing progress events can refer to anything, so Uppy doesn't try to be smart about them. There are two types of processing progress events: determinate and indeterminate. Some processing does not have meaningful progress beyond "not done" and "done". For example, sending a request to initialize a server-side resource that will be uploaded to. In those situations, indeterminate progress is suitable.

### `preprocess-progress(fileID, progress)`

`progress` is an object with properties:

 - `mode` - Either `'determinate'` or `'indeterminate'`.
 - `message` - A message to show to the user. Something like `'Preparing upload...'`, but be more specific if possible.

When `mode` is `'determinate'`, also add the `value` property:

 - `value` - A progress value between 0 and 1.

### `upload-progress(progress)`

`progress` is an object with properties:

 - `uploader` - The uploader plugin that fired the event (`this`).
 - `id` - The file ID.
 - `bytesTotal` - The full amount of bytes to be uploaded.
 - `bytesUploaded` - The amount of bytes that have been uploaded so far.

### `postprocess-progress(fileID, progress)`

`progress` is an object with properties:

 - `mode` - Either `'determinate'` or `'indeterminate'`.
 - `message` - A message to show to the user. Something like `'Preparing upload...'`, but be more specific if possible.

When `mode` is `'determinate'`, also add the `value` property:

 - `value` - A progress value between 0 and 1.

## UI Plugins

TODO after preact switch

[core.setfilestate]: /docs/uppy#uppy-setFileState-fileID-state
