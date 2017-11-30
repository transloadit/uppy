---
type: docs
order: 30
title: "Tus"
permalink: docs/tus/
---

The Tus plugin brings [tus.io](http://tus.io) resumable file uploading to Uppy by wrapping the [tus-js-client][].

```js
uppy.use(Tus, {
  resume: true,
  autoRetry: true,
  retryDelays: [0, 1000, 3000, 5000]
})
```

## Options

The Tus plugin supports all of [tus-js-client][]'s options.
Additionally:

### `autoRetry: true`

Whether to auto-retry the upload when the user's internet connection is back online after an outage.

[tus-js-client]: https://github.com/tus/tus-js-client
