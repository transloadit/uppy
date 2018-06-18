---
type: docs
order: 1
title: "Uppy"
permalink: docs/uppy/
---

This is the core module that orchestrates everything in Uppy, exposing `state`, `events` and `methods`.

```js
const Uppy = require('@uppy/core')

const uppy = Uppy()
```

## Options

```js
const uppy = Uppy({
  id: 'uppy',
  autoProceed: true,
  debug: false,
  restrictions: {
    maxFileSize: null,
    maxNumberOfFiles: null,
    minNumberOfFiles: null,
    allowedFileTypes: null
  },
  meta: {},
  onBeforeFileAdded: (currentFile, files) => currentFile,
  onBeforeUpload: (files) => {},
  locale: defaultLocale,
  store: new DefaultStore()
})
```

### `id: 'uppy'`

A site-wide unique ID for the instance.

If multiple Uppy instances are being used, for instance, on two different pages, an `id` should be specified. This allows Uppy to store information in `localStorage` without colliding with other Uppy instances.

Note that this ID should be persistent across page reloads and navigation—it shouldn't be a random number that is different every time Uppy is loaded.
For example, if one Uppy instance is used to upload user avatars, and another to add photos to a blog post, you might use:

```js
const avatarUploader = Uppy({ id: 'avatar' })
const photoUploader = Uppy({ id: 'post' })
```

### `autoProceed: true`

Uppy will start uploading automatically after the first file is selected.

### `restrictions: {}`

Optionally, provide rules and conditions to limit the type and/or number of files that can be selected.

**Parameters**

- `maxFileSize` *null | number* — maximum file size in bytes for each individual file (total max size [has been requested, and is planned](https://github.com/transloadit/uppy/issues/514))
- `maxNumberOfFiles` *null | number* — total number of files that can be selected
- `minNumberOfFiles` *null | number* — minimum number of files that must be selected before the upload
- `allowedFileTypes` *null | array* of wildcards `image/*`, exact mime types `image/jpeg`, or file extensions `.jpg`: `['image/*', '.jpg', '.jpeg', '.png', '.gif']`

`maxNumberOfFiles` also affects the number of files a user is able to select via the system file dialog in UI plugins like `DragDrop`, `FileInput` and `Dashboard`: when set to `1`, they will only be able to select a single file. When `null` or another number is provided, they will be able to select multiple files.

`allowedFileTypes` gets passed to the system file dialog via [`<input>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#Limiting_accepted_file_types)’s accept attribute, so only files matching these types will be selectable.

### `meta: {}`

Metadata object, used for passing things like public keys, usernames, tags and so on:

```js
meta: {
  username: 'John'
}
```

This global metadata is added to each file in Uppy. It can be modified by two methods:

1. [`uppy.setMeta({ username: 'Peter' })`](/docs/uppy/#uppy-setMeta-data) — set or update meta for all files.
2. [`uppy.setFileMeta('myfileID', { resize: 1500 })`](/docs/uppy/#uppy-setFileMeta-fileID-data) — set or update meta for specific file.

Metadata from each file is then attached to uploads in [Tus](/docs/tus/) and [XHRUpload](/docs/xhrupload/) plugins.

Metadata can also be added from a `<form>` element on your page, through the [Form](/docs/form/)plugin or through the UI if you are using Dashboard with the [`metaFields`](/docs/dashboard/#metaFields) option.

<a id="onBeforeFileAdded"></a>
### `onBeforeFileAdded: (currentFile, files) => currentFile`

A function run before a file is added to Uppy. It gets passed `(currentFile, files)` where `currentFile` is a file that is about to be added, and `files` is an object with all files that already are in Uppy.

Use this function to run any number of custom checks on the selected file, or manipulate it, for instance, by optimizing a file name.

Return true/nothing or a modified file object to proceed with adding the file:

```js
onBeforeFileAdded: (currentFile, files) => {
  if (currentFile.name === 'forest-IMG_0616.jpg') {
    return true
  }
}

// or

onBeforeFileAdded: (currentFile, files) => {
  const modifiedFile = Object.assign(
    {},
    currentFile,
    { name: currentFile + Date.now()
  })
  return modifiedFile
}
```

Return false to abort adding the file:

```js
onBeforeFileAdded: (currentFile, files) => {
  if (!currentFile.type) {
    // log to console
    uppy.log(`Skipping file because it has no type`)
    // show error message to the user
    uppy.info(`Skipping file because it has no type`, 'error', 500)
    return false
  }
}
```

**Note:** it is up to you to show a notification to the user about a file not passing validation. We recommend showing a message using [uppy.info()](#uppy-info) and logging to console for debugging purposes.


<a id="onBeforeUpload"></a>
### `onBeforeUpload: (files) => files`

A function run before an upload begins. Gets passed `files` object with all the files that are already in Uppy.

Use this to check if all files or their total number match your requirements, or manipulate all the files at once before upload.

Return true or modified `files` object to proceed:

```js
onBeforeUpload: (files) => {
  const updatedFiles = Object.assign({}, files)
  Object.keys(updatedFiles).forEach(fileId => {
    updatedFiles[fileId].name = 'myCustomPrefix_' + updatedFiles[fileId].name
  })
  return updatedFiles
}
```

Return false to abort:

```js
onBeforeUpload: (files) => {
  if (Object.keys(files).length < 2) {
    // log to console
    uppy.log(`Aborting upload because only ${Object.keys(files).length} files were selected`)
    // show error message to the user
    uppy.info(`You have to select at least 2 files`, 'error', 500)
    return false
  }
}
```

**Note:** it is up to you to show a notification to the user about a file not passing validation. We recommend showing a message using [uppy.info()](#uppy-info) and logging to console for debugging purposes.

### `locale: {}`

This allows you to override language strings:

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

It also offers the pluralization function, which is used to determine which string will be used for the provided `smart_count` number.

For example, for the Icelandic language, the pluralization function would be:

``` js
locale: {
  pluralize: (n) => (n % 10 !== 1 || n % 100 === 11) ? 1 : 0
}
```

We are using a forked [Polyglot.js](https://github.com/airbnb/polyglot.js/blob/master/index.js#L37-L60).

### `store: defaultStore()`

The Store that is used to keep track of internal state. By [default](/docs/stores/#DefaultStore), a simple object is used.

This option can be used to plug Uppy state into an external state management library, such as [Redux](/docs/stores/#ReduxStore). You can then write custom views with the library that is also used by the rest of the application.

<!-- TODO document store API -->

## Methods

### `uppy.use(plugin, opts)`

Add a plugin to Uppy, with an optional plugin options object.

```js
const Uppy = require('@uppy/core')
const DragDrop = require('@uppy/drag-drop')

const uppy = Uppy()
uppy.use(DragDrop, { target: 'body' })
```

### `uppy.getID()`

Get the Uppy instance ID, see the [`id` option](#id-39-uppy-39).

### `uppy.addFile(fileObject)`

Add a new file to Uppy’s internal state.

```js
uppy.addFile({
  name: 'my-file.jpg', // file name
  type: 'image/jpeg', // file type
  data: blob, // file blob
  source: 'Local', // optional, determines the source of the file, for example, Instagram
  isRemote: false // optional, set to true if actual file is not in the browser, but on some remote server, for example, when using uppy-server in combination with Instagram
})
```

`addFile` gives an error if the file cannot be added, either because `onBeforeFileAdded(file)` gave an error, or because `uppy.opts.restrictions` checks failed.

If `uppy.opts.autoProceed === true`, Uppy will begin uploading automatically when files are added.

### `uppy.removeFile(fileID)`

Remove a file from Uppy.

```js
uppy.removeFile('uppyteamkongjpg1501851828779')
```

Removing a file that is already being uploaded cancels that upload.

### `uppy.getFile(fileID)`

Get a specific file object by its ID.

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

### `uppy.getFiles()`

Get an array of all file objects in Uppy. See [uppy.getFile()](#uppy-getFile-fileID) for an example of the file object format.

```js
const prettyBytes = require('pretty-bytes')
const items = uppy.getFiles().map(() =>
  `<li>${file.name} - ${prettyBytes(file.size)}</li>`
).join('')
document.querySelector('.file-list').innerHTML = `<ul>${items}</ul>`
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

Update Uppy's internal state. Usually, this method is called internally, but in some cases it might be useful to alter something directly, especially when implementing your own plugins.

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

State in Uppy is considered to be immutable. When updating values, it is your responsibility to not mutate them, but instead create copies. See [Redux docs](http://redux.js.org/docs/recipes/UsingObjectSpreadOperator.html) for more info on this. Here is an example from Uppy.Core that updates progress for a particular file in state:

```js
// We use Object.assign({}, obj) to create a copy of `obj`.
const updatedFiles = Object.assign({}, uppy.getState().files)
// We use Object.assign({}, obj, update) to create an altered copy of `obj`.
const updatedFile = Object.assign({}, updatedFiles[fileID], {
  progress: Object.assign({}, updatedFiles[fileID].progress, {
    bytesUploaded: data.bytesUploaded,
    bytesTotal: data.bytesTotal,
    percentage: Math.floor((data.bytesUploaded / data.bytesTotal * 100).toFixed(2))
  })
))
updatedFiles[data.id] = updatedFile
uppy.setState({files: updatedFiles})
```

### `uppy.getState()`

Returns the current state from the [Store](#store-defaultStore).

### `uppy.setFileState(fileID, state)`

Update the state for a single file. This is mostly useful for plugins that may want to store data on file objects, or that need to pass file-specific configurations to other plugins that support it.

`fileID` is the string file ID. `state` is an object that will be merged into the file's state object.

### `uppy.setMeta(data)`

Alters global `meta` object in state, the one that can be set in Uppy options and gets merged with all newly added files. Calling `setMeta` will also merge newly added meta data with previously selected files.

```js
uppy.setMeta({ resize: 1500, token: 'ab5kjfg' })
```

### `uppy.setFileMeta(fileID, data)`

Update metadata for a specific file.

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

Sets a message in state, with optional details, that can be shown by notification UI plugins. Currently, that means just the [Informer](/docs/informer/) plugin, included by default in Dashboard.

```js
this.info('Oh my, something good happened!', 'success', 3000)
```

```js
this.info({
    message: 'Oh no, something bad happened!',
    details: 'File couldn’t be uploaded because there is no internet connection',
  }, 'error', 5000)
```

`info-visible` and `info-hidden` events are emitted when this info message should be visible or hidden.

### `uppy.on('event', action)`

Subscribe to an uppy-event. See below for the full list of events.

## Events

Uppy exposes events that you can subscribe to in your app:

### `file-added`

Fired each time a file is added.

```javascript
uppy.on('file-added', (file) => {
  console.log('Added file', file)
})
```

### `file-removed`

Fired each time a file is removed.

```javascript
uppy.on('file-removed', (file) => {
  console.log('Removed file', file)
})
```

### `upload`

Fired when upload starts.

```javascript
uppy.on('upload', (data) => {
  // data object consists of `id` with upload ID and `fileIDs` array
  // with file IDs in current upload
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

Fired each time a single upload is completed.

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

Fired when Uppy fails to upload/encode the entire upload. That error is then set to `uppy.getState().error`.

### `upload-error`

Fired when an error occurs with a specific file:

``` javascript
uppy.on('upload-error', (file, error) => {
  console.log('error with file:', file.id)
  console.log('error message:', error)
})
```

### `info-visible`

Fired when “info” message should be visible in the UI. By default, `Informer` plugin is displaying these messages (enabled by default in `Dashboard` plugin). You can use this event to show messages in your custom UI:

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
