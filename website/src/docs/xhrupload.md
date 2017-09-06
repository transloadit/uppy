---
type: docs
order: 8
title: "XHRUpload"
permalink: docs/xhrupload/
---

The XHRUpload plugin handles classic HTML multipart form uploads, as well as uploads using the HTTP `PUT` method.

[Try it live](/examples/xhrupload/)

```js
uppy.use(XHRUpload, {
  endpoint: 'http://my-website.org/upload'
})
```

## Options

### `endpoint: ''`

URL to upload to.

### `method: 'post'`

HTTP method to use for the upload.

### `formData: true`

Whether to use a multipart form upload, using [FormData][].
When `true`, file metadata is also sent to the endpoint as separate form fields.
When `false`, only the file contents are sent.

### `fieldName: 'files[]'`

When `formData` is true, this is used as the form field name for the file to be uploaded.

### `metaFields: null`

Pass an array of field names to limit the metadata fields that will be sent to the endpoint as form fields.
For example, `metaFields: ['name']` will only send the `name` field.
Passing `null` (the default) will send *all* metadata fields.

If the `formData` option is false, `metaFields` has no effect.

### `headers: {}`

An object containing HTTP headers to use for the upload request.
Keys are header names, values are header values.

```js
headers: {
  'authorization': `Bearer ${window.getCurrentUserToken()}`
}
```

[FormData]: https://developer.mozilla.org/en-US/docs/Web/API/FormData
