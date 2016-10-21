---
type: api
order: 0
title: "API"
permalink: api/
---

*Work in progress, API not stable. Last update: 2016-10-21*

## The Gist

{% include_code lang:js ../api-usage-example.ejs %}

## Methods

### `uppy.use(plugin)`

``` javascript
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
