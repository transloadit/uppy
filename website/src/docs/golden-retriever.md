---
title: "Golden Retriever"
type: docs
permalink: docs/golden-retriever/
order: 40
---

Golden Retriever plugin, also known and used as `RestoreFiles`, saves selected files in your browser cache (Local Storage for metadata, then Service Worker for all blobs + IndexedDB for small blobs), so that if the browser crashes, Uppy can restore everything and continue uploading like nothing happened. Read more about it [on the blog](https://uppy.io/blog/2017/07/golden-retriever/).

1\. Bundle your own service worker `sw.js` file with Uppy Golden Retriever’s service worker. If you’re using Browserify, just bundle it separately, for Webpack there is a plugin [serviceworker-webpack-plugin](https://github.com/oliviertassinari/serviceworker-webpack-plugin).

```js
// sw.js

require('uppy/lib/RestoreFiles/ServiceWorker.js')
```

2\. Register it in your app entry point:

```js
// you app.js entry point

uppy.use(RestoreFiles, {serviceWorker: true})
uppy.run()

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js') // path to your bundled service worker with Golden Retriever service worker
    .then((registration) => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope)
    })
    .catch((error) => {
      console.log('Registration failed with ' + error)
    })
}
```
