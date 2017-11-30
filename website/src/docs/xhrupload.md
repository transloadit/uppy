---
type: docs
order: 31
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
This works similarly to using a `<form>` element with an `<input type="file">` for uploads.
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

### `getResponseData(xhr)`

When an upload has completed, Uppy will extract response data from the upload endpoint and send it back in the `core:upload-success` event.
By default, Uppy assumes the endpoint will return JSON. So, if `POST /upload` responds with:

```json
{
  "url": "https://public.url/to/file",
  "whatever": "beep boop"
}
```

That object will be emitted in the `core:upload-success` event.

Not all endpoints respond with JSON. Providing a `getResponseData` function overrides this behavior.
The `xhr` parameter is the `XMLHttpRequest` instance used to upload the file.

For example, an endpoint that responds with an XML document:

```js
getResponseData (xhr) {
  return {
    url: xhr.responseXML.querySelector('Location').textContent
  }
}
```

### `getResponseError(xhr)`

If the upload endpoint responds with a non-2xx status code, the upload is assumed to have failed.
The endpoint might have responded with some information about the error, though.
Pass in a `getResponseError` function to extract error data from the `XMLHttpRequest` instance used for the upload.

For example, if the endpoint responds with a JSON object containing a `{ message }` property, this would show that message to the user:

```js
getResponseError (xhr) {
  return new Error(JSON.parse(xhr.response).message)
}
```

### `responseUrlFieldName: 'url'`

The field name containing a publically accessible location of the uploaded file in the response data returned by `getResponseData(xhr)`.

### `timeout: 30 * 1000`

When no upload progress events have been received for this amount of milliseconds, assume the connection has an issue and abort the upload.
Note that unlike the [`XMLHttpRequest.timeout`][XHR.timeout] property, this is a timer between progress events: the total upload can take longer than this value.
Set to `0` to disable this check.

The default is 30 seconds.

### `limit: 0`

Limit the amount of uploads going on at the same time. Passing `0` means no limit.

[FormData]: https://developer.mozilla.org/en-US/docs/Web/API/FormData
[XHR.timeout]: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/timeout
