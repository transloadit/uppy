---
type: api
order: 0
title: "API"
permalink: api/
---

## The Gist

Uppy file uploader consists of a Core module and a bunch of Plugins that extend it’s functionality. Like this:

```js
const Uppy = require('uppy/lib/core')
const Dashboard = require('uppy/lib/plugins/Dashboard')
const Tus10 = require('uppy/lib/plugins/Tus10')
 
const uppy = Uppy({ autoProceed: false })
  .use(Dashboard, {
    trigger: '#select-files', 
    replaceTargetContent: true
  })
  .use(Tus10, {endpoint: '://master.tus.io/files/'})
  .run()
 
uppy.on('core:success', (files) => {
  console.log(`Upload complete! We’ve uploaded these files: ${files}`)
})
```

Check out the [full list of Uppy options](#uppy-options).

Uppy is not very useful just by itself. To add a nice UI for selecting files, manipulating them and even uploading, we use [various plugins](#plugins).

## Uppy Options

```js
const uppy = Uppy({
  autoProceed: true,
  restrictions: {
    maxFileSize: false,
    maxNumberOfFiles: false,
    minNumberOfFiles: false,
    allowedFileTypes: false
  },
  onBeforeFileAdded: (currentFile, files) => Promise.resolve(),
  onBeforeUpload: (files, done) => Promise.resolve(),
  locale: defaultLocale
})
```

### `autoProceed`

Starts upload automatically after first file is selected.

### `restrictions`

Allows you to provide rules and conditions for which files can be selected.

## `onBeforeFileAdded`

A function run before a file is added to Uppy. Gets passed `(currentFile, files)` where `currentFile` is a file that is about to be added, and `files` is an object with all files that already are in Uppy. Return `Promise.resolve` to proceed with adding the file or `Promise.reject` to abort. Use this function to run any number of custom checks on the selected file, or manipulating it, like optimizing a file name, for example.

```js
onBeforeFileAdded: (currentFile, files) => {
  if (currentFile.name === 'pitercss-IMG_0616.jpg') {
    return Promise.resolve()
  }
  return Promise.reject('this is not the file I was looking for')
}
```

## `onBeforeUpload`

A function run before an upload begins. Gets passed `files` object with all files that already are in Uppy. Return `Promise.resolve` to proceed with adding the file or `Promise.reject` to abort. Use this to check if all files or their total number match your requirements, or manipulate all the files at once before upload.

```js
onBeforeUpload: (files) => {
  if (Object.keys(files).length < 2) {
    return Promise.reject('too few files')
  }
  return Promise.resolve()
}
```

## `locale`

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

For Russian language:

```js
locale: {
  pluralize: (n) => {
    if (n % 10 === 1 && n % 100 !== 11) {
      return 0
    }

    if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) {
      return 1
    }

    return 2
  }
}
```

Icelandic:

```js
locale: {
  pluralize: (n) => (n % 10 !== 1 || n % 100 === 11) ? 1 : 0
}
``` 

We are using a forked [Polyglot.js](https://github.com/airbnb/polyglot.js/blob/master/index.js#L37-L60).


## Uppy Methods

### `uppy.use(plugin, opts)`

Add a plugin to Uppy.

```js
const Uppy = require('uppy/lib/core')
const DragDrop = require('uppy/lib/plugins/DragDrop')

const uppy = Uppy()
uppy.use(DragDrop)
```

### `uppy.run()`

Initializes everything after setup.

### uppy.on('event', action)

Subscribe to an event.

## Events

Uppy exposes events that you can subscribe to in your app:

### core:upload-progress

Fired each time file upload progress is available, `data` object looks like this:

```javascript
data = {
  id: myimg12321323,
  bytesUploaded: 2323254,
  bytesTotal
}
```

```javascript
uppy.on('core:upload-progress', (data) => {
  console.log(data.id, data.bytesUploaded, data.bytesTotal)
})
```

### `core:upload-success`

Fired when single upload is complete.

``` javascript
uppy.on('core:upload-success', (fileId, url) => {
  console.log(url)
  var img = new Image()
  img.width = 300
  img.alt = fileId
  img.src = url
  document.body.appendChild(img)
})
```

### `core:success`

Fired when all uploads are complete.

``` javascript
uppy.on('core:success', (fileCount) => {
  console.log(fileCount)
})
```
