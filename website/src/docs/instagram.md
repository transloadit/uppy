---
type: docs
order: 53
title: "Instagram"
permalink: docs/instagram/
---

The Instagram plugin lets users import files their Google Drive account.

An Uppy Server instance is required for the Instagram plugin to work. Uppy Server handles authentication with Instagram, downloads the pictures and videos, and uploads them to the destination. This saves the user bandwidth, especially helpful if they are on a mobile connection.

```js
const Instagram = require('uppy/lib/plugins/Instagram')

uppy.use(Instagram, {
  // Options
})
```

[Try live!](/examples/dashboard/)

## Options

```js
uppy.use(Instagram, {
  target: Dashboard,
  serverUrl: 'https://server.uppy.io/',
})
```

### `id: 'Instagram'`

A unique identifier for this plugin. Defaults to `'Instagram'`.

### `target: null`

DOM element, CSS selector, or plugin to mount the Instagram provider into. This should normally be the Dashboard.

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
