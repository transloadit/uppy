---
order: 7
title: "Tus"
permalink: docs/tus/
---

Tus plugin brings [tus.io](http://tus.io) resumable file uploading to Uppy by wrapping the [tus-js-client](https://github.com/tus/tus-js-client).

## Options

```js
uppy.use(Tus10, {
  resume: true,
  allowPause: true,
  autoRetry: true,
  retryDelays: [0, 1000, 3000, 5000]
})
```

