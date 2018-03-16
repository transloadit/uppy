---
type: docs
order: 1
title: "Uppy"
permalink: docs/uppy/
---

Core module that orchestrates everything in Uppy, exposing `state`, `events` and `methods`.

## Options

```js
const uppy = Uppy({
  id: 'uppy',
  autoProceed: true,
  debug: false,
  restrictions: {
    maxFileSize: false,
    maxNumberOfFiles: false,
    minNumberOfFiles: false,
    allowedFileTypes: false
  },
  meta: {},
  onBeforeFileAdded: (currentFile, files) => Promise.resolve(),
  onBeforeUpload: (files) => Promise.resolve(),
  locale: defaultLocale,
  store: new DefaultStore()
})
```

### `id: 'uppy'`

A site-wide unique ID for the instance.

If multiple Uppy instances are being used, for example on two different pages, an `id` should be specified. This allows Uppy to store information in `localStorage` without colliding with other Uppy instances.

Note that this ID should be persistent across page reloads and navigation—it shouldn't be a random number that's different every time Uppy is loaded.
For example, if one Uppy instance is used to upload user avatars, and another to add photos to a blog post, you might use:

```js
const avatarUploader = Uppy({ id: 'avatar' })
const photoUploader = Uppy({ id: 'post' })
```

### `autoProceed: true`

Uppy will start uploading automatically after the first file is selected.

### `restrictions: {}`

Optionally provide rules and conditions for which files can be selected.

**Parameters**

- `maxFileSize` *number*
- `maxNumberOfFiles` *number*
- `minNumberOfFiles` *number*
- `allowedFileTypes` *array* of wildcards or exact mime types, like `image/*`

### `meta: {}`

Metadata object, pass things like public keys, usernames, tags or whatever:

```js
meta: {
  username: 'John'
}
```

This global metadata is added to each file in Uppy. It can be modified with two methods:

1. [`uppy.setMeta({ username: 'Peter' })`](/docs/uppy/#uppy-setmeta-data) — set or update meta for all files.
2. [`uppy.setFileMeta('myfileID', { resize: 1500 })`](/docs/uppy/#uppy-setFileMeta-fileID-data) — set or update meta for specific file. 

Metadata from each file is then attached to uploads in [Tus](/docs/tus/) and [XHRUpload](/docs/tus/) plugins.

Metadata can also be added from a `<form>` element on your page via [Form](/docs/form/)plugin or via UI if you are using Dashboard with [`metaFields`](/docs/dashboard/#metaFields) option.

### `onBeforeFileAdded: (currentFile, files) => Promise.resolve()`

A function run before a file is added to Uppy. Gets passed `(currentFile, files)` where `currentFile` is a file that is about to be added, and `files` is an object with all files that already are in Uppy. Return `Promise.resolve` to proceed with adding the file or `Promise.reject` to abort. Use this function to run any number of custom checks on the selected file, or manipulating it, like optimizing a file name, for example.

```js
onBeforeFileAdded: (currentFile, files) => {
  if (currentFile.name === 'forest-IMG_0616.jpg') {
    return Promise.resolve()
  }
  return Promise.reject('This is not the file I was looking for')
}
```

### `onBeforeUpload: (files) => Promise.resolve()`

A function run before an upload begins. Gets passed `files` object with all files that already are in Uppy. Return `Promise.resolve` to proceed with adding the file or `Promise.reject` to abort. Use this to check if all files or their total number match your requirements, or manipulate all the files at once before upload.

```js
onBeforeUpload: (files) => {
  if (Object.keys(files).length < 2) {
    return Promise.reject('too few files')
  }
  return Promise.resolve()
}
```

### `locale: {}`

Same deal as in plugins, this allows you to override language strings:

```js
locale: {
  strings: {
    youCanOnlyUploadX: {
      0: 'You can only upload %{smart_count} file',
      1: 'You can only upload %{smart_count} files'
    },
    youHaveToAtLeastSelectX: {
      0: 'You have to select at least %{smart_count} file',
      1: 'You have to select at least %{smart_count} files'
    },
    exceedsSize: 'This file exceeds maximum allowed size of',
    youCanOnlyUploadFileTypes: 'You can only upload:',
    uppyServerError: 'Connection with Uppy Server failed'
  }
}
```

As well as the pluralization function, which is used to determine which string will be used for the provided `smart_count` number.

For example, for Icelandic language the pluralization function would be:

``` js
locale: {
  pluralize: (n) => (n % 10 !== 1 || n % 100 === 11) ? 1 : 0
}
```

We are using a forked [Polyglot.js](https://github.com/airbnb/polyglot.js/blob/master/index.js#L37-L60).

### `store: defaultStore()`

The Store to use to keep track of internal state. By default, a simple object is used.

This option can be used to plug Uppy state into an external state management library, such as Redux. Then, you can write custom views with the library that is also used by the rest of the application.

<!-- TODO document store API -->

## Methods

### `uppy.use(plugin, opts)`

Add a plugin to Uppy, with an optional plugin options object.

```js
const Uppy = require('uppy/lib/core')
const DragDrop = require('uppy/lib/plugins/DragDrop')

const uppy = Uppy()
uppy.use(DragDrop, { target: 'body' })
```

### `uppy.run()`

Initializes everything after setup. Must be called before calling `.upload()` or using Uppy in any meaningful way.

### `uppy.getID()`

Get the uppy instance ID, see the [`id` option](#id-39-uppy-39).

### `uppy.addFile(fileObject)`

Add a new file to Uppy’s internal state.

```js
uppy.addFile({
  name: 'my-file.jpg', // file name
  type: 'image/jpeg', // file type
  data: blob, // file blob
  source: 'Local', // optional, sets what added the file, for example, Instagram
  isRemote: false // optional, set to true if actual file is not in the browser, but on some remote server, like when using uppy-server + Instagram, for example
})
```

`addFile` attempts to determine file type by [magic bytes](https://github.com/sindresorhus/file-type) + the provided `type` + extension; then checks if the file can be added, considering `uppy.opts.restrictions`, sets metadata and generates a preview, if it’s an image.

If `uppy.opts.autoProceed === true`, Uppy will begin uploading after the first file is added.

### `uppy.getFile(fileID)`

A shortcut method that returns a specific file object from `uppy.state` by its `fileID`.

```js
const file = uppy.getFile('uppyteamkongjpg1501851828779')

file.id        // 'uppyteamkongjpg1501851828779'
file.name      // 'nature.jpg'
file.extension // '.jpg'
file.type      // 'image/jpeg'
file.data      // the Blob object
file.size      // 3947642 (returns 'N/A' if size cannot be determined)
file.preview   // value that can be used to populate "src" attribute of an "img" tag
```

### `uppy.upload()`

Start uploading selected files.

Returns a Promise `result` that resolves with an object containing two arrays of uploaded files:

- `result.successful` - Files that were uploaded successfully.
- `result.failed` - Files that did not upload successfully. These file objects will have a `.error` property describing what went wrong.

```js
uppy.upload().then((result) => {
  console.info('Successful uploads:', result.successful)

  if (result.failed.length > 0) {
    console.error('Errors:')
    result.failed.forEach((file) => {
      console.error(file.error)
    })
  }
})
```

### `uppy.setState(patch)`

Update `uppy.state`. Usually this method is called internally, but in some cases it might be useful to alter something in `uppy.state` directly.

Uppy’s default state on initialization:

```js
{
  plugins: {},
  files: {},
  currentUploads: {},
  capabilities: {
    resumableUploads: false
  },
  totalProgress: 0,
  meta: Object.assign({}, this.opts.meta),
  info: {
    isHidden: true,
    type: 'info',
    message: ''
  }
}
```

Updating state:

```js
uppy.setState({
  smth: true
})
```

We don’t mutate `uppy.state`, so internally `setState` creates a new copy of state and replaces `uppy.state` with it. However, when updating values, it’s your responsibility to not mutate them, but instead create copies. See [Redux docs](http://redux.js.org/docs/recipes/UsingObjectSpreadOperator.html) for more info on this. Here’s an example from Uppy.Core that updates progress for a particular file in state:

```js
const updatedFiles = Object.assign({}, uppy.getState().files)
const updatedFile = Object.assign({}, updatedFiles[fileID],
  Object.assign({}, {
    progress: Object.assign({}, updatedFiles[fileID].progress, {
      bytesUploaded: data.bytesUploaded,
      bytesTotal: data.bytesTotal,
      percentage: Math.floor((data.bytesUploaded / data.bytesTotal * 100).toFixed(2))
    })
  }
))
updatedFiles[data.id] = updatedFile
uppy.setState({files: updatedFiles})
```

### `uppy.getState()`

Returns `uppy.state`, which you can also use directly.

### `uppy.setFileState(fileID, state)`

Update the state for a single file. This is mostly useful for plugins that may want to store data on file objects, or that need to pass file-spcecific configuration to other plugins that support it.

`fileID` is the string file ID. `state` is an object that will be merged into the file's state object.

### `uppy.setMeta(data)`

Alters global `meta` object is state, the one that can be set in Uppy options and gets merged with all newly added files. Calling `setMeta` will also merge newly added meta data with previously selected files.

```js
uppy.setMeta({ resize: 1500, token: 'ab5kjfg' })
```

### `uppy.setFileMeta(fileID, data)`

Updated metadata for a specific file.

```js
uppy.setFileMeta('myfileID', { resize: 1500 })
```

### `uppy.reset()`

Stop all uploads in progress and clear file selection, set progress to 0. Basically, return things to the way they were before any user input.

### `uppy.close()`

Uninstall all plugins and close down this Uppy instance. Also runs `uppy.reset()` before uninstalling.

### `uppy.log()`

#### Parameters

- **message** *{string}*
- **type** *{string=}* `error` or `warning`

Logs stuff to console, only if `uppy.opts.debug` is set to true. Silent in production.

```js
uppy.log('[Dashboard] adding files...')
```

### `uppy.info()`

#### Parameters

- **message** *{(string|object)}* — `'info message'` or `{ message: 'Oh no!', details: 'File couldn’t be uploaded' }`
- **type** *{string} [type='info']* — `info`, `warning`, `success` or `error`
- **duration** *{number} [duration = 3000]* — in milliseconds

Sets a message in state, with optional details, that can be shown by notification UI plugins. Currently that means just the [Informer](/docs/informer/) plugin, included by default in Dashboard.

```js
this.info('Oh my, something good happened!', 'success', 3000)
```

```js
this.info({
    message: 'Oh no, something bad happened!',
    details: 'File couldn’t be uploaded because there’s no internet connection',
  }, 'error', 5000)
```

`info-visible` and `info-hidden` events are emitted when this info message should be visible or hidden.

### `uppy.on('event', action)`

Subscribe to an uppy-event. See below for the full list of events.

## Events

Uppy exposes events that you can subscribe to in your app:

### `file-added`

Fired each time file is added.

```javascript
uppy.on('file-added', (file) => {
  console.log('Added file', file)
})
```

### `file-removed`

Fired each time file is removed.

```javascript
uppy.on('file-removed', (file) => {
  console.log('Removed file', file)
})
```

### `upload`

Fired when upload starts.

```javascript
uppy.on('upload', (data) => {
  // data object consists of `id` with upload id and `fileIDs` array 
  // with file ids in current upload
  // data: { id, fileIDs }
  console.log(`Starting upload ${id} for files ${fileIDs}`)
})
```

### `upload-progress`

Fired each time file upload progress is available:


```javascript
uppy.on('upload-progress', (file, progress) => {
  // file: { id, name, type, ... }
  // progress: { uploader, bytesUploaded, bytesTotal }
  console.log(file.id, progress.bytesUploaded, progress.bytesTotal)
})
```

### `upload-success`

Fired each time a single upload is complete.

``` javascript
uppy.on('upload-success', (file, resp, uploadURL) => {
  console.log(file.name, uploadURL)
  var img = new Image()
  img.width = 300
  img.alt = fileId
  img.src = uploadURL
  document.body.appendChild(img)
})
```

### `complete`

Fired when all uploads are complete.

The `result` parameter is an object with arrays of `successful` and `failed` files, just like in [`uppy.upload()`](#uppy-upload)’s return value.

``` javascript
uppy.on('complete', (result) => {
  console.log('successful files:', result.successful)
  console.log('failed files:', result.failed)
})
```

### `error`

Fired when Uppy fails to upload/encode the whole upload. That error is then set to `uppy.state.error`.

### `upload-error`

Fired when an error occures with a specific file:

``` javascript
uppy.on('upload-error', (file, error) => {
  console.log('error with file:', file.id)
  console.log('error message:', error)
})
```

### `info-visible`

Fired when “info” message should be visible in the UI. By default `Informer` plugin is displaying these messages (enabled by default in `Dashboard` plugin). You can use this event to show messages in your custom UI:

``` javascript
uppy.on('info-visible', () => {
  const info = uppy.getState().info
  // info: {
  //  isHidden: false,
  //  type: 'error',
  //  message: 'Failed to upload',
  //  details: 'Error description'
  // }
  alert(`${info.message} ${info.details}`)
})
```

### `info-hidden`

Fired when “info” message should be hidden in the UI. See [`info-visible`](#info-visible).
