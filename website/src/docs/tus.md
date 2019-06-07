---
type: docs
order: 0
title: "Tus"
module: "@uppy/tus"
permalink: docs/tus/
category: 'Destinations'
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

The `@uppy/tus` plugin supports all of [tus-js-client][]’s options. In addition to that, it has the following configurable options:

### `id: 'Tus'`

A unique identifier for this plugin. It defaults to `'Tus'`.

### `resume: true`

A boolean indicating whether Tus should attempt to resume the upload if the upload has been started in the past. This includes storing the file’s upload URL. Set to false to force an entire reupload.

Note that this option is about resuming when you start an upload again with the same file, or when using the [GoldenRetriever](/docs/golden-retriever/) plugin, which will attempt to restore upload state to what it was before page refresh / browser crash. Even if you set `resume: false` when using the Tus uploader, users will still be able to pause/resume an ongoing upload.

In most cases you should leave this option as is, relax, and enjoy resumable uploads.

### `endpoint: ''`

Destination URL for your uploads. This should be where your tus.io server is running.

### `metaFields: null`

Pass an array of field names to limit the metadata fields that will be added to uploads as [Tus Metadata](https://tus.io/protocols/resumable-upload.html#upload-metadata).

* Set this to `['name']` to only send the `name` field.
* Set this to `null` (the default) to send *all* metadata fields.
* Set this to an empty array `[]` to not send any fields.

### `autoRetry: true`

Configures whether or not to auto-retry the upload when the user's internet connection is back online after an outage.

### `limit: 0`

Limit the amount of uploads going on at the same time. Setting this to `0` means there is no limit on concurrent uploads.

[tus-js-client]: https://github.com/tus/tus-js-client
