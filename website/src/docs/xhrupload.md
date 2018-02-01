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

### `data: {}`

A hash with additional data that you want included in the [FormData][] for every upload.
```js
...
data: {
  // Static include for all files of this instance
  mySuperCoolProperty: 'This is value for "mySuperCoolProperty" key in the FormData'
},
...
```
You may alternatively supply a function that returns a hash with the data to be included for each file. 
```js
...
data: (file) => {
  return {
    extension: file.extension
  }
},
...
```
Finally, the function may return a non-object (i.e. string, number) which will be included in each upload's form  
data with the key of "data".
```js
...
data: (file) => {
  return file.extension // the extension will go in the form data with the key of "data"
},
...
```

*Pro Tip:* if you return `null` or `undefined` in your generator function, no data will be included for that 
upload. This means you could include data conditionally for each file based on anything your 
creativity can come up with.

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

When an upload has completed, Uppy will extract response data from the upload endpoint and send it back in the `upload-success` event:

```js
uppy.on('upload-success', (fileId, resp, uploadURL) => {
  // do something with resp
})
```

By default, Uppy assumes the endpoint will return JSON. So, if `POST /upload` responds with:

```json
{
  "url": "https://public.url/to/file",
  "whatever": "beep boop"
}
```

That object will be emitted in the `upload-success` event. Not all endpoints respond with JSON. Providing a `getResponseData` function overrides this behavior. The `xhr` parameter is the `XMLHttpRequest` instance used to upload the file.

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

## Uploading to a PHP Server

The XHRUpload plugin works similarly to a `<form>` upload. You can use the `$_FILES` variable on the server to work with uploaded files. See the PHP documentation on [Handling file uploads][PHP.file-upload].

The default form field for file uploads is `files[]`, which means you have to access the `$_FILES` array as described in [Uploading multiple files][PHP.multiple]:

```php
<?php
// upload.php
$files = $_FILES['files'];
$file_path = $files['tmp_name'][0]; // temporary upload path of the first file
move_uploaded_file($file_path, './img/img.png'); // save the file at `img/img.png`
```

Set a custom `fieldName` to make working with the `$_FILES` array a bit less convoluted:

```js
// app.js
uppy.use(XHRUpload, {
  endpoint: '/upload.php',
  fieldName: 'my_file'
})
```

```php
<?php
// upload.php
$my_file = $_FILES['my_file'];
$file_path = $my_file['tmp_name']; // temporary upload path of the file
$file_name = $my_file['name']; // original name of the file
move_uploaded_file($file_path, './img/' . basename($file_name)); // save the file at `img/FILE_NAME`
```

[FormData]: https://developer.mozilla.org/en-US/docs/Web/API/FormData
[XHR.timeout]: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/timeout
[PHP.file-upload]: https://secure.php.net/manual/en/features.file-upload.php
[PHP.multiple]: https://secure.php.net/manual/en/features.file-upload.multiple.php
