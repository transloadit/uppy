---
type: docs
order: 45
title: "DeleteFiles"
permalink: docs/deleteFiles/
---

The DeleteFiles plugin helps to send request to server when user deletes a file.

## Options

```js
uppy.use(DeleteFiles, {
  endpoint: 'http://my-website.org/delete',
  method: 'DELETE',
  fieldName: 'fileId',
  headers: {}
})
```

### `endpoint: ''`

URL to send requests to

### `method: 'delete'`

HTTP method to use for the requests.

### `fieldName: 'fileId'`

Form field name for the file id to be sent along with the request.

### `headers: {}`

An object containing HTTP headers to use for the request.
Keys are header names, values are header values.

```js
headers: {
  'authorization': `Bearer ${window.getCurrentUserToken()}`
}
```
