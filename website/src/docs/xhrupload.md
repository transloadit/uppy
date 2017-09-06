---
type: docs
order: 8
title: "XHRUpload"
permalink: docs/xhrupload/
---

The XHRUpload plugin handles classic HTML multipart form uploads, as well as uploads using the HTTP `PUT` method.

## Options

```js
uppy.use(Tus10, {
  resume: true,
  allowPause: true,
  autoRetry: true,
  retryDelays: [0, 1000, 3000, 5000]
})
```

