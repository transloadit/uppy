---
type: docs
order: 1
title: "Uppy"
module: "@uppy/core"
permalink: docs/uppy/
category: "Docs"
tagline: "The core module that orchestrates everything"
---

This is the core module that orchestrates everything in Uppy, managing state and events and providing methods.

```js
const Uppy = require('@uppy/core')

const uppy = Uppy()
```

## Installation

Install from NPM:

```shell
npm install @uppy/core
```

In the [CDN package](/docs/#With-a-script-tag), it is available on the `Uppy` global object:

```js
const Core = Uppy.Core
```

## TypeScript

When using TypeScript, Uppy has weak type checking by default. That means that the options to plugins are not type-checked. For example, this is allowed:
```ts
import Uppy = require('@uppy/core')
import Tus = require('@uppy/tus')
const uppy = Uppy()
uppy.use(Tus, {
  invalidOption: null,
  endpoint: ['a', 'wrong', 'type']
})
```

As of Uppy 1.10, Uppy supports a strict typechecking mode. This mode typechecks the options passed in to plugins. This will be the only mode in Uppy 2.0, but is currently optional to preserve backwards compatibility. The strict mode can be enabled by passing a special generic type parameter to the Uppy constructor:

```ts
import Uppy = require('@uppy/core')
import Tus = require('@uppy/tus')
const uppy = Uppy<Uppy.StrictTypes>()
uppy.use(Tus, {
  invalidOption: null // this will now make the compilation fail!
})
```

If you are storing Uppy instances in your code, for example in a property on a React or Angular component class, make sure to add the `StrictTypes` flag there as well:
```ts
class MyComponent extends React.Component {
  private uppy: Uppy<Uppy.StrictTypes>
}
```

In Uppy 2.0, this generic parameter will be removed, and your plugin options will always be type-checked.

## Options

The Uppy core module has the following configurable options:

```js
const uppy = Uppy({
  id: 'uppy',
  autoProceed: false,
  allowMultipleUploads: true,
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
  locale: {},
  store: new DefaultStore(),
  logger: justErrorsLogger
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

### `autoProceed: false`

By default Uppy will wait for an upload button to be pressed in the UI, or an `.upload()` method to be called, before starting an upload. Setting this to `autoProceed: true` will start uploading automatically after the first file is selected.

### `allowMultipleUploads: true`

Whether to allow multiple upload batches. This means multiple calls to `.upload()`, or a user adding more files after already uploading some. An upload batch is made up of the files that were added since the previous `.upload()` call.

With this option set to `true`, users can upload some files, and then add _more_ files and upload those as well. A model use case for this is uploading images to a gallery or adding attachments to an email.

With this option set to `false`, users can upload some files, and you can listen for the ['complete'](/docs/uppy/#complete) event to continue to the next step in your app's upload flow. A typical use case for this is uploading a new profile picture. If you are integrating with an existing HTML form, this option gives the closest behaviour to a bare `<input type="file">`.

### `logger`

An object of methods that are called with debug information from [`uppy.log`](/docs/uppy/#uppy-log).

Set `logger: Uppy.debugLogger` to get debug info output to the browser console:

```js
const Uppy = require('@uppy/core')
const uppy = Uppy({
  logger: Uppy.debugLogger
})
```

You can also provide your own logger object: it should expose `debug`, `warn` and `error` methods, as shown in the examples below.

Here’s an example of a `logger` that does nothing:

```js
const nullLogger = {
  debug: (...args) => {},
  warn: (...args) => {},
  error: (...args) => {}
}
```

`logger: Uppy.debugLogger` looks like this:

```js
const debugLogger = {
  debug: (...args) => {
    // IE 10 doesn’t support console.debug
    const debug = console.debug || console.log
    debug.call(console, `[Uppy] [${getTimeStamp()}]`, ...args)
  },
  warn: (...args) => console.warn(`[Uppy] [${getTimeStamp()}]`, ...args),
  error: (...args) => console.error(`[Uppy] [${getTimeStamp()}]`, ...args)
}
```

By providing your own `logger`, you can send the debug information to a server, choose to log errors only, etc.

### `restrictions: {}`

Optionally, provide rules and conditions to limit the type and/or number of files that can be selected.

**Parameters**

- `maxFileSize` *null | number* — maximum file size in bytes for each individual file (total max size [has been requested, and is planned](https://github.com/transloadit/uppy/issues/514))
- `maxNumberOfFiles` *null | number* — total number of files that can be selected
- `minNumberOfFiles` *null | number* — minimum number of files that must be selected before the upload
- `allowedFileTypes` *null | array* of wildcards `image/*`, exact mime types `image/jpeg`, or file extensions `.jpg`: `['image/*', '.jpg', '.jpeg', '.png', '.gif']`

`maxNumberOfFiles` also affects the number of files a user is able to select via the system file dialog in UI plugins like `DragDrop`, `FileInput` and `Dashboard`: when set to `1`, they will only be able to select a single file. When `null` or another number is provided, they will be able to select multiple files.

`allowedFileTypes` gets passed to the system file dialog via [`<input>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#Limiting_accepted_file_types)’s accept attribute, so only files matching these types will be selectable.

> If you’d like to force a certain meta field data to be entered before the upload, you can [do so using `onBeforeUpload`](https://github.com/transloadit/uppy/issues/1703#issuecomment-507202561).

> If you need to restrict `allowedFileTypes` to a file extension with double dots, like `.nii.gz`, you can do so by [setting `allowedFileTypes` to just the last part of the extension, `allowedFileTypes: ['.gz']`, and then using `onBeforeFileAdded` to filter for `.nii.gz`](https://github.com/transloadit/uppy/issues/1822#issuecomment-526801208).

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

Metadata can also be added from a `<form>` element on your page, through the [Form](/docs/form/) plugin or through the UI if you are using Dashboard with the [`metaFields`](/docs/dashboard/#metaFields) option.

<a id="onBeforeFileAdded"></a>
### `onBeforeFileAdded: (currentFile, files) => currentFile`

A function run before a file is added to Uppy. It gets passed `(currentFile, files)` where `currentFile` is a file that is about to be added, and `files` is an object with all files that already are in Uppy.

Use this function to run any number of custom checks on the selected file, or manipulate it, for instance, by optimizing a file name.

> ⚠️ Note that this method is intended for quick synchronous checks/modifications only. If you need to do an async API call, or heavy work on a file (like compression or encryption), you should utilize a [custom plugin](/docs/writing-plugins/#Example-of-a-custom-plugin) instead.

Return true/nothing or a modified file object to proceed with adding the file:

```js
onBeforeFileAdded: (currentFile, files) => {
  if (currentFile.name === 'forest-IMG_0616.jpg') {
    return true
  }
}

// or

onBeforeFileAdded: (currentFile, files) => {
  const modifiedFile = {
    ...currentFile,
    name: currentFile.name + '__' + Date.now()
  }
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

**Note:** it is up to you to show a notification to the user about a file not passing validation. We recommend showing a message using [uppy.info()](#uppy-info) and logging to console for debugging purposes via [uppy.log()](#uppy-log).


<a id="onBeforeUpload"></a>
### `onBeforeUpload: (files) => files`

A function run before an upload begins. Gets passed `files` object with all the files that are already in Uppy.

Use this to check if all files or their total number match your requirements, or manipulate all the files at once before upload.

> ⚠️ Note that this method is intended for quick synchronous checks/modifications only. If you need to do an async API call, or heavy work on a file (like compression or encryption), you should utilize a [custom plugin](/docs/writing-plugins/#Example-of-a-custom-plugin) instead.

Return true or modified `files` object to proceed:

```js
onBeforeUpload: (files) => {
  // We’ll be careful to return a new object, not mutating the original `files`
  const updatedFiles = {}
  Object.keys(files).forEach(fileID => {
    updatedFiles[fileID] = {
      ...files[fileID],
      name: 'myCustomPrefix' + '__' + files[fileID].name
    }
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

**Note:** it is up to you to show a notification to the user about a file not passing validation. We recommend showing a message using [uppy.info()](#uppy-info) and logging to console for debugging purposes via [uppy.log()](#uppy-log).

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
    youCanOnlyUploadFileTypes: 'You can only upload: %{types}',
    companionError: 'Connection with Companion failed'
  }
}
```

Instead of overriding strings yourself, consider using [one of our language packs](https://github.com/transloadit/uppy/tree/master/packages/%40uppy/locales) (or contributing one!):

```js
const russianLocale = require('@uppy/locales/lib/ru_RU')
// ^-- OR: import russianLocale from '@uppy/locales/lib/ru_RU'
const uppy = Uppy({
  locale: russianLocale,
})
```

If you use Uppy from a CDN, [there's an example](/examples/i18n/) showcasing how to change languages.

For flexibility, you can pass a `locale` at the `Uppy`/core level, or to Plugins individually. The locale strings that you set in core take precedence.

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

### `uppy.removePlugin(instance)`

Uninstall and remove a plugin.

### `uppy.getPlugin(id)`

Get a plugin by its [`id`](/docs/plugins/#id) to access its methods.

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
  isRemote: false // optional, set to true if actual file is not in the browser, but on some remote server, for example, when using companion in combination with Instagram
})
```

`addFile` gives an error if the file cannot be added, either because `onBeforeFileAdded(file)` gave an error, or because `uppy.opts.restrictions` checks failed.

If you try to add a file that already exists, `addFile` will throw an error. Unless that duplicate file was dropped with a folder — duplicate files from different folders are allowed, when selected with that folder. This is because we add `file.meta.relativePath` to the `file.id`.

If `uppy.opts.autoProceed === true`, Uppy will begin uploading automatically when files are added.

`addFile` will return the generated id for the file that was added.

> Sometimes you might need to add a remote file to Uppy. This can be achieved by [fetching the file, then creating a Blob object, or using the Url plugin with Companion](https://github.com/transloadit/uppy/issues/1006#issuecomment-413495493).
>
> Sometimes you might need to mark some files as “already uploaded”, so that the user sees them, but they won’t actually be uploaded by Uppy. This can be achieved by [looping through files and setting `uploadComplete: true, uploadStarted: false` on them](https://github.com/transloadit/uppy/issues/1112#issuecomment-432339569)

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

### `uppy.pauseResume(fileID)`

Toggle pause/resume on an upload. Will only work if resumable upload plugin, such as [Tus](/docs/tus/), is used.

### `uppy.pauseAll()`

Pause all uploads. Will only work if a resumable upload plugin, such as [Tus](/docs/tus/), is used.

### `uppy.resumeAll()`

Resume all uploads. Will only work if resumable upload plugin, such as [Tus](/docs/tus/), is used.

### `uppy.retryUpload(fileID)`

Retry an upload (after an error, for example).

### `uppy.retryAll()`

Retry all uploads (after an error, for example).

### `uppy.cancelAll()`

Cancel all uploads, reset progress and remove all files.

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

```js
uppy.getPlugin('Url').addFile('path/to/remote-file.jpg')
```

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

### `uppy.setOptions(opts)`

Change Uppy options on the fly. For example, to conditionally change `allowedFileTypes` or `locale`:

```js
const uppy = Uppy()
uppy.setOptions({
  restrictions: { maxNumberOfFiles: 3 },
  autoProceed: true
})

uppy.setOptions({
  locale: {
    strings: {
      'cancel': 'Отмена'
    }
  }
})
```

You can also change options for plugin on the fly, like this:

```js
// Change width of the Dashboard drag-and-drop aread on the fly
uppy.getPlugin('Dashboard').setOptions({
  width: 300
})
```

### `uppy.reset()`

Stop all uploads in progress and clear file selection, set progress to 0. Basically, return things to the way they were before any user input.

### `uppy.close()`

Uninstall all plugins and close down this Uppy instance. Also runs `uppy.reset()` before uninstalling.

### `uppy.log()`

#### Parameters

- **message** *{string}*
- **type** *{string=}* `error` or `warning`

Logs stuff to [`logger`](/docs/uppy/#logger) methods.

See [`logger`](/docs/uppy/#logger) docs for details.

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

### `uppy.off('event', action)`

Unsubscribe to an uppy-event. See below for the full list of events.

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

`response` object (depending on the uploader plugin used, it might contain less info, the example is for `@uppy/xhr-upload`):

```js
{
  status, // HTTP status code (0, 200, 300)
  body, // response body
  uploadURL // the file url, if it was returned
}
```

``` javascript
uppy.on('upload-success', (file, response) => {
  console.log(file.name, response.uploadURL)
  var img = new Image()
  img.width = 300
  img.alt = file.id
  img.src = response.uploadURL
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

Fired each time a single upload has errored.

`response` object is an optional parameter and may be undefined depending on the uploader plugin used, it might contain less info, the example is for `@uppy/xhr-upload`:

```js
{
  status, // HTTP status code (0, 200, 300)
  body // response body
}
```

``` javascript
uppy.on('upload-error', (file, error, response) => {
  console.log('error with file:', file.id)
  console.log('error message:', error)
})
```

### `upload-retry`

Fired when an upload has been retried (after an error, for example):

```js
uppy.on('upload-retry', (fileID) => {
  console.log('upload retried:', fileID)
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

### `cancel-all`

Fired when [`uppy.cancelAll()`]() is called, all uploads are canceled, files removed and progress is reset.

### `restriction-failed`

Fired when a file violates certain restrictions when added. This event is just providing another choice for those who want to customize the behavior of file upload restrictions.

```javascript
uppy.on('restriction-failed', (file, error) => {
  // do some customized logic like showing system notice to users
})
```

### `reset-progress`

Fired when `uppy.resetProgress()` is called, each file has its upload progress reset to zero.

```javascript
uppy.on('reset-progress', () => {
  // progress was reset
})
```
