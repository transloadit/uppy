---
type: docs
order: 8
title: "Tus10"
permalink: docs/tus/
---

The Tus10 plugin brings [tus.io](http://tus.io) resumable file uploading to Uppy by wrapping the [tus-js-client][].

```js
uppy.use(Tus10, {
  resume: true,
  autoRetry: true,
  retryDelays: [0, 1000, 3000, 5000]
})
```

## Options

The Tus10 plugin supports all of [tus-js-client][]'s options.
Additionally:

### `autoRetry: true`

Whether to auto-retry the upload when the user's internet connection is back online after an outage.

[tus-js-client]: https://github.com/tus/tus-js-client
