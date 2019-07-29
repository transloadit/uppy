---
type: docs
order: 0
title: "Tus"
module: "@uppy/tus"
permalink: docs/tus/
category: 'Destinations'
tagline: uploads using the <a href="https://tus.io">tus</a> resumable upload protocol
---

The `@uppy/tus` plugin brings resumable file uploading by [tus.io](http://tus.io) to Uppy by wrapping the [tus-js-client][].

```js
const Tus = require('@uppy/tus')

uppy.use(Tus, {
  endpoint: 'https://master.tus.io/files/', // use your tus endpoint here
  resume: true,
  autoRetry: true,
  retryDelays: [0, 1000, 3000, 5000]
})
```

## Installation

This plugin is published as the `@uppy/tus` package.

Install from NPM:

```shell
npm install @uppy/tus
```

In the [CDN package](/docs/#With-a-script-tag), it is available on the `Uppy` global object:

```js
const Tus = Uppy.Tus
```

## Options

### `id: 'Tus'`

A unique identifier for this plugin. It defaults to `'Tus'`.

### `resume: true`

A boolean indicating whether Tus should attempt to resume the upload if the upload has been started in the past. This includes storing the file’s upload URL. Set to false to force an entire reupload.

Note that this option is about resuming when you start an upload again with the same file, or when using the [GoldenRetriever](/docs/golden-retriever/) plugin, which will attempt to restore upload state to what it was before page refresh / browser crash. Even if you set `resume: false` when using the Tus uploader, users will still be able to pause/resume an ongoing upload.

In most cases you should leave this option as is, relax, and enjoy resumable uploads.

### `removeFingerprintOnSuccess: false`

If the `resume` option is enabled, it will store some data in localStorage for each upload. With `removeFingerprintOnSuccess`, this data is removed once an upload has completed. The effect is that if the same file is uploaded again, it will create an entirely new upload.

### `endpoint: ''`

Destination URL for your uploads. This should be where your tus.io server is running.

### `headers: {}`

Additional request headers to send to the Tus endpoint when making requests.

### `chunkSize: Infinity`

A number indicating the maximum size of a chunk in bytes which will be uploaded in a single request. This can be used when a server or proxy has a limit on how big request bodies may be. Note that if the server has hard limits (such as the minimum 5MB chunk size imposed by S3), specifying a chunk size which falls outside those hard limits will cause chunked uploads to fail.

### `withCredentials: false`

Configure XMLHttpRequests to send Cookies in requests using the [`xhr.withCredentials`](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials) property. The remote server must accept CORS and credentials.

### `overridePatchMethod: false`

Whether the POST method should be used instead of PATCH for transfering file chunks. This may be necessary if a browser or the server does not support latter one. In this case, a POST request will be made with the X-HTTP-Method-Override: PATCH header. The server must be able to detect it, and then handle the request as if PATCH would have been the method.

### `retryDelays: [0, 1000, 3000, 5000]`

When uploading a chunk fails, automatically try again after the millisecond intervals specified in this array. By default, we first retry instantly; if that fails, we retry after 1 second; if that fails, we retry after 3 seconds, etc.

Set to `null` to disable automatic retries, and fail instantly if any chunk fails to upload.

### `metaFields: null`

Pass an array of field names to limit the metadata fields that will be added to uploads as [Tus Metadata](https://tus.io/protocols/resumable-upload.html#upload-metadata).

* Set this to `['name']` to only send the `name` field.
* Set this to `null` (the default) to send *all* metadata fields.
* Set this to an empty array `[]` to not send any fields.

### `autoRetry: true`

Configures whether or not to auto-retry the upload when the user's internet connection is back online after an outage.

Note that this is unrelated to the `retryDelays` option. The `retryDelays` option specifies how often to retry an upload that failed. The `autoRetry` option attempts to retry uploads that failed in the past, once the network has changed.

### `limit: 0`

Limit the amount of uploads going on at the same time. Setting this to `0` means there is no limit on concurrent uploads.

[tus-js-client]: https://github.com/tus/tus-js-client
