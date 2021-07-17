---
title: "Golden Retriever"
module: "@uppy/golden-retriever"
type: docs
permalink: docs/golden-retriever/
order: 1
category: "Miscellaneous"
tagline: "restore files and continue uploading after a page refresh or a browser crash"
---

The `@uppy/golden-retriever` plugin saves selected files in your browser cache, so that if the browser crashes, Uppy can restore everything and continue uploading as if nothing happened. You can read more about it [on our blog](https://uppy.io/blog/2017/07/golden-retriever/).

The Golden Retriever uses LocalStorage to store file metadata and Uppy state, and IndexedDB for small files. It also uses a Service Worker for *all* files because, unlike IndexedDB, a Service Worker can keep very large files. Service Worker storage is *very* temporary though, and doesn't persist across browser crashes or restarts. It works very well, however, for accidental refreshes or closed tabs.

## Installation

This plugin is published as the `@uppy/golden-retriever` package.

Install from NPM:

```shell
npm install @uppy/golden-retriever
```

In the [CDN package](/docs/#With-a-script-tag), it is available on the `Uppy` global object:

```js
const { GoldenRetriever } = Uppy
```

## Usage

1\. Bundle your own service worker `sw.js` file with Uppy GoldenRetriever’s service worker. If you are using Browserify, just bundle it separately. For Webpack, there is a plugin [serviceworker-webpack-plugin](https://github.com/oliviertassinari/serviceworker-webpack-plugin).

```js
// sw.js

import('@uppy/golden-retriever/lib/ServiceWorker')
```

2\. Register it in your app entry point:

```js
// you app.js entry point
import GoldenRetriever from '@uppy/golden-retriever'

uppy.use(GoldenRetriever, { serviceWorker: true })

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js') // path to your bundled service worker with GoldenRetriever service worker
    .then((registration) => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope)
    })
    .catch((error) => {
      console.log(`Registration failed with ${error}`)
    })
}
```

Voilà, that’s it. Happy retrieving!
