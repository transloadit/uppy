---
type: docs
order: 1
title: "Uppy"
permalink: docs/uppy/
---

Core module that orchistrated everything in Uppy, exposing `state`, `events` and `methods`.

## Options

```js
const uppy = Uppy({
  id: 'uppy',
  autoProceed: true,
  restrictions: {
    maxFileSize: false,
    maxNumberOfFiles: false,
    minNumberOfFiles: false,
    allowedFileTypes: false
  },
  meta: {},
  onBeforeFileAdded: (currentFile, files) => Promise.resolve(),
  onBeforeUpload: (files, done) => Promise.resolve(),
  locale: defaultLocale,
  store: defaultStore()
})
```

### `id: 'uppy'`

A site-wide unique ID for the instance.
If multiple Uppy instances are being used, for example on two different pages, an `id` should be specified.
This allows Uppy to store information in `localStorage` without colliding with other Uppy instances.

Note that this ID should be persistent across page reloads and navigation—it shouldn't be a random number that's different every time Uppy is loaded.
For example, if one Uppy instance is used to upload user avatars, and another to add photos to a blog post, you might use:

```js
const avatarUploader = Uppy({ id: 'avatar' })
const photoUploader = Uppy({ id: 'post' })
```

### `autoProceed: true`

Starts upload automatically after the first file is selected.

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

Can be altered with `uppy.setMeta({username: 'Peter'})` method.

### `onBeforeFileAdded: (currentFile, files) => Promise.resolve()`

A function run before a file is added to Uppy. Gets passed `(currentFile, files)` where `currentFile` is a file that is about to be added, and `files` is an object with all files that already are in Uppy. Return `Promise.resolve` to proceed with adding the file or `Promise.reject` to abort. Use this function to run any number of custom checks on the selected file, or manipulating it, like optimizing a file name, for example.

```js
onBeforeFileAdded: (currentFile, files) => {
  if (currentFile.name === 'pitercss-IMG_0616.jpg') {
    return Promise.resolve()
  }
  return Promise.reject('this is not the file I was looking for')
}
```

### `onBeforeUpload: (files, done) => Promise.resolve()`

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
    youCanOnlyUploadFileTypes: 'You can only upload:'
  }
}
```

As well as the pluralization function, which is used to determin which string will be used for the provided `smart_count` number.

For example, for Icelandic language the pluralization function will be:

``` js
locale: {
  pluralize: (n) => (n % 10 !== 1 || n % 100 === 11) ? 1 : 0
}
```

We are using a forked [Polyglot.js](https://github.com/airbnb/polyglot.js/blob/master/index.js#L37-L60).

## `store: defaultStore()`

The Store to use to keep track of internal state. By default, a simple object is used.
This option can be used to plug Uppy state into an external state management library, such as Redux.
Then, you can write custom views with the library that is also used by the rest of the application.

<!-- TODO document store API -->

## Methods

### `uppy.use(plugin, opts)`

Add a plugin to Uppy, with an optional plugin options object.

```js
const Uppy = require('uppy/lib/core')
const DragDrop = require('uppy/lib/plugins/DragDrop')

const uppy = Uppy()
uppy.use(DragDrop, {target: 'body'})
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
  data: fileBlob, // file blob
  source: 'Local', // optional, sets what added the file, for example, Instagram
  isRemote: false // optional, set to true if actual file is not in the browser, but on some remote server, like when using uppy-server + Instagram, for example
})
```

`addFile` attemps to determine file type by [magic bytes](https://github.com/sindresorhus/file-type) + the provided `type` + extension; then checks if the file can be added, considering `uppy.opts.restrictions`, sets metadata and generates a preview, if it’s an image.

If `uppy.opts.autoProceed === true`, Uppy will begin uploading after the first file is added.

### `uppy.getFile(fileID)`

A shortcut method that returns a specific file object from `uppy.state` by its `fileID`.

```js
const file = uppy.getFile('uppyteamkongjpg1501851828779')
const img = document.createElement('img')
img.src = file.preview
document.body.appendChild(img)
```

### `uppy.setState(patch)`

Update `uppy.state`. Usually this method is called internally, but in some cases it might be useful to alter something in `uppy.state` directly.

Uppy’s default state on initialization:

```js
this.state = {
  files: {},
  capabilities: {
    resumableUploads: false
  },
  totalProgress: 0,
  meta: Object.assign({}, this.opts.meta)
}
```

Updating state:

```js
uppy.setState({
  smth: true
})
```

We don’t mutate `uppy.state`, so internally `setState` creates a new copy of state and replaces uppy.state with it. However, when updating values, it’s your responsibility to not mutate them, but instead create copies. See [Redux docs](http://redux.js.org/docs/recipes/UsingObjectSpreadOperator.html) for more info on this. Here’s an example from Uppy.Core that updates progress for a particular file in state:

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

### `uppy.setMeta(data)`

Alters global `meta` object is state, the one that can be set in Uppy options and gets merged with all newly added files.

```js
uppy.setMeta({resize: 1500})
```

### `uppy.updateMeta(data, fileID)`

Updated metadata for a specific file.

```js
uppy.updateMeta({resize: 1500}, 'myfileID')
```

### `uppy.reset()`

Stop all uploads in progress and clear file selection, set progress to 0. Basically, return things to the way they were before any user input.

### `uppy.close()`

Uninstall all plugins and close down this Uppy instance. Also runs `uppy.reset()` before uninstalling.

### `uppy.log(msgString)`

Logs stuff to console, only if `uppy.opts.debug` is set to true. Silent in production.

### `uppy.info()`

```js
this.info('Oh my, something good happened!', 'success', 5000)
```

#### Parameters

- **message** *string*
- **type** *string* `info`, `warning`, `success` or `error`
- **duration** *number* in milliseconds

### `uppy.upload()`

Start uploading selected files.

Returns a Promise `result` that resolves with an object containing two arrays of uploaded files.

 - `result.successful` - Files that were uploaded successfully.
 - `result.failed` - Files that did not upload successfully.
   These file objects will have a `.error` property describing what went wrong.

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

### `uppy.on('event', action)`

Subscribe to an uppy-event. See full list of events below.

## Events

Uppy exposes events that you can subscribe to in your app:

### `upload-progress`

Fired each time file upload progress is available, `data` object looks like this:

```javascript
data = {
  id: myimg12321323,
  bytesUploaded: 2323254,
  bytesTotal
}
```

```javascript
uppy.on('upload-progress', (data) => {
  console.log(data.id, data.bytesUploaded, data.bytesTotal)
})
```

### `upload-success`

Fired when single upload is complete.

``` javascript
uppy.on('upload-success', (fileId, url) => {
  console.log(url)
  var img = new Image()
  img.width = 300
  img.alt = fileId
  img.src = url
  document.body.appendChild(img)
})
```

### `complete`

Fired when all uploads are complete.
The `result` parameter is an object with arrays of `successful` and `failed` files, just like in [`uppy.upload()`](#uppy-upload)'s return value.

``` javascript
uppy.on('complete', (result) => {
  console.log(result)
})
```
