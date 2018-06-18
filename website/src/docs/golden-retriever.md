---
title: "GoldenRetriever"
type: docs
permalink: docs/golden-retriever/
order: 40
---

The GoldenRetriever plugin saves selected files in your browser cache (Local Storage for metadata, then Service Worker for all blobs + IndexedDB for small blobs), so that if the browser crashes, Uppy can restore everything and continue uploading like nothing happened. Read more about it [on the blog](https://uppy.io/blog/2017/07/golden-retriever/).

1\. Bundle your own service worker `sw.js` file with Uppy GoldenRetriever’s service worker. If you’re using Browserify, just bundle it separately, for Webpack there is a plugin [serviceworker-webpack-plugin](https://github.com/oliviertassinari/serviceworker-webpack-plugin).

```js
// sw.js

require('@uppy/golden-retriever/lib/ServiceWorker')
```

2\. Register it in your app entry point:

```js
// you app.js entry point
const GoldenRetriever = require('@uppy/golden-retriever')

uppy.use(GoldenRetriever, {serviceWorker: true})

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js') // path to your bundled service worker with GoldenRetriever service worker
    .then((registration) => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope)
    })
    .catch((error) => {
      console.log('Registration failed with ' + error)
    })
}
```

Voila, that’s it. Happy retrieving!
