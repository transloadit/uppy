---
type: docs
order: 0
title: "Tus"
module: "@uppy/tus"
permalink: docs/tus/
category: "Destinations"
tagline: "uploads using the <a href='https://tus.io'>tus</a> resumable upload protocol"
---

The `@uppy/tus` plugin brings resumable file uploading by [tus.io](http://tus.io) to Uppy by wrapping the [tus-js-client][].

```js
import Tus from '@uppy/tus'

uppy.use(Tus, {
  endpoint: 'https://tusd.tusdemo.net/files/', // use your tus endpoint here
  retryDelays: [0, 1000, 3000, 5000],
})
```

## Installation

This plugin is published as the `@uppy/tus` package.

Install from NPM:

```shell
npm install @uppy/tus
```

In the [CDN package](/docs/#With-a-script-tag), the plugin class is available on the `Uppy` global object:

```js
const { Tus } = Uppy
```

## Options

**Note**: all options are passed to `tus-js-client` and we document the ones here that we added or changed. This means you can also pass functions like [`onAfterResponse`](https://github.com/tus/tus-js-client/blob/master/docs/api.md#onafterresponse).

We recommended taking a look at the [API reference](https://github.com/tus/tus-js-client/blob/master/docs/api.md) from `tus-js-client` to know what is supported.

### `id: 'Tus'`

A unique identifier for this plugin. It defaults to `'Tus'`.

### `endpoint: ''`

Destination URL for your uploads. This should be where your tus.io server is running.

### `headers: {}`

<!--retext-simplify ignore additional-->

An object containing additional HTTP headers to send to the Tus endpoint when making requests.
Keys are header names, values are header values.

```js
const headers = {
  authorization: `Bearer ${window.getCurrentUserToken()}`,
}
```

Header values can also be derived from file data by providing a function. The function receives a [File Object][File Objects] and must return an object where the keys are header names, and values are header values.

```js
const headers = (file) => {
  return {
    authorization: `Bearer ${window.getCurrentUserToken()}`,
    expires: file.meta.expires,
  }
}
```

### `chunkSize: Infinity`

A number indicating the maximum size of a chunk in bytes which will be uploaded in a single request. This can be used when a server or proxy has a limit on how big request bodies may be. Note that if the server has hard limits (such as the minimum 5MB chunk size imposed by S3), specifying a chunk size which falls outside those hard limits will cause chunked uploads to fail.

### `withCredentials: false`

Configure XMLHttpRequests to send Cookies in requests using the [`xhr.withCredentials`](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials) property. The remote server must accept CORS and credentials.

### `overridePatchMethod: false`

Whether the POST method should be used instead of PATCH for transfering file chunks. This may be necessary if a browser or the server does not support latter one. In this case, a POST request will be made with the X-HTTP-Method-Override: PATCH header. The server must be able to detect it, and then handle the request as if PATCH would have been the method.

### `retryDelays: [0, 1000, 3000, 5000]`

When uploading a chunk fails, automatically try again after the millisecond intervals specified in this array. By default, we first retry instantly; if that fails, we retry after 1 second; if that fails, we retry after 3 seconds, etc.

Set to `null` to disable automatic retries, and fail instantly if any chunk fails to upload.

### `onBeforeRequest(req, file)`

Behaves like the [`onBeforeRequest`](https://github.com/tus/tus-js-client/blob/master/docs/api.md#onbeforerequest) function from `tus-js-client` but with the added `file` argument.

### `onShouldRetry: (err, retryAttempt, options, next) => next(err)`

When an upload fails `onShouldRetry` is called with the error and the default retry logic as the second argument. The default retry logic is an [exponential backoff](https://en.wikipedia.org/wiki/Exponential_backoff) algorithm triggered on HTTP 429 (Too Many Requests) errors. Meaning if your server (or proxy) returns HTTP 429 because it’s being overloaded, @uppy/tus will find the ideal sweet spot to keep uploading without overloading.

If you want to extend this functionality, for instance to retry on unauthorized requests (to retrieve a new authentication token):

```js
import Uppy from '@uppy/core'
import Tus from '@uppy/tus'

new Uppy().use(Tus, {
  endpoint: '',
  async onBeforeRequest (req) {
    const token = await getAuthToken()
    req.setHeader('Authorization', `Bearer ${token}`)
  },
  onShouldRetry (err, retryAttempt, options, next) {
    if (err?.originalResponse?.getStatus() === 401) {
      return true
    }
    return next(err)
  },
  async onAfterResponse (req, res) {
    if (res.getStatus() === 401) {
      await refreshAuthToken()
    }
  },
})
```

### `allowedMetaFields: null`

Pass an array of field names to limit the metadata fields that will be added to uploads as [Tus Metadata](https://tus.io/protocols/resumable-upload.html#upload-metadata).

* Set this to an empty array `[]` to not send any fields.
* Set this to `['name']` to only send the `name` field.
* Set this to `null` (the default) to send _all_ metadata fields.

### `limit: 5`

Limit the amount of uploads going on at the same time. Setting this to `0` means no limit on concurrent uploads.

[tus-js-client]: https://github.com/tus/tus-js-client

[File Objects]: /docs/uppy/#File-Objects
