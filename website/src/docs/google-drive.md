---
type: docs
order: 52
title: "GoogleDrive"
permalink: docs/google-drive/
---

The GoogleDrive plugin lets users import files their Google Drive account.

An Uppy Server instance is required for the GoogleDrive plugin to work. Uppy Server handles authentication with Google, downloads files from the Drive and uploads them to the destination. This saves the user bandwidth, especially helpful if they are on a mobile connection.

```js
const GoogleDrive = require('@uppy/google-drive')

uppy.use(GoogleDrive, {
  // Options
})
```

[Try live!](/examples/dashboard/)

## Installation

This plugin is published as the `@uppy/google-drive` package.

```shell
npm install @uppy/google-drive
```

## Options

```js
uppy.use(GoogleDrive, {
  target: Dashboard,
  serverUrl: 'https://server.uppy.io/',
})
```

### `id: 'GoogleDrive'`

A unique identifier for this plugin. Defaults to `'GoogleDrive'`.

### `target: null`

DOM element, CSS selector, or plugin to mount the GoogleDrive provider into. This should normally be the Dashboard.

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
