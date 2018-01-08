---
type: docs
order: 30
title: "Tus"
permalink: docs/tus/
---

The Tus plugin brings [tus.io](http://tus.io) resumable file uploading to Uppy by wrapping the [tus-js-client][].

```js
uppy.use(Tus, {
  endpoint: 'https://master.tus.io/files/', // use your tus endpoint here
  resume: true,
  autoRetry: true,
  retryDelays: [0, 1000, 3000, 5000]
})
```

## Options

The Tus plugin supports all of [tus-js-client][]’s options. Additionally:

### `resume: true`

A boolean indicating whether tus should attempt to resume the upload if the upload has been started in the past. This includes storing the file’s upload url. Use false to force an entire reupload.

Note that this opition is about resuming when you start an upload again with the same file, or when using [Golden Retriever](/docs/golden-retriever/), which will attempt to restore upload state to what it was before page refresh / browser crash. Even if you set `resume: false` when using Tus uploader, users will still be able to pause/resume an ongoing upload.

In most cases you should leave this option as is, relax, and enjoy resumable uploads.

### `endpoint: ''`

URL to upload to, where your tus.io server is running.

### `autoRetry: true`

Whether to auto-retry the upload when the user's internet connection is back online after an outage.

[tus-js-client]: https://github.com/tus/tus-js-client
