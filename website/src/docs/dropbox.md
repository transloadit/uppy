---
type: docs
order: 51
title: "Dropbox"
permalink: docs/dropbox/
---

The Dropbox plugin lets users import files their Google Drive account.

An Uppy Server instance is required for the Dropbox plugin to work. Uppy Server handles authentication with Dropbox, downloads the files, and uploads them to the destination. This saves the user bandwidth, especially helpful if they are on a mobile connection.

```js
const Dropbox = require('@uppy/dropbox')

uppy.use(Dropbox, {
  // Options
})
```

[Try live!](/examples/dashboard/)

## Options

```js
uppy.use(Dropbox, {
  target: Dashboard,
  serverUrl: 'https://server.uppy.io/',
})
```

### `id: 'Dropbox'`

A unique identifier for this plugin. Defaults to `'Dropbox'`.

### `target: null`

DOM element, CSS selector, or plugin to mount the Dropbox provider into. This should normally be the Dashboard.

### `serverUrl: null`

URL to an Uppy Server instance.

### `locale: {}`

Localize text that is shown to the user.

The default English strings are:

```js
strings: {
  // TODO
}
```
