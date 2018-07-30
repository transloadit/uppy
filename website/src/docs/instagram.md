---
type: docs
order: 33
title: "Instagram"
module: "@uppy/instagram"
permalink: docs/instagram/
---

The `@uppy/instagram` plugin lets users import files from their Instagram account.

An Uppy Server instance is required for the `@uppy/instagram` plugin to work. Uppy Server handles authentication with Instagram, downloads the pictures and videos, and uploads them to the destination. This saves the user bandwidth, especially helpful if they are on a mobile connection.

```js
const Instagram = require('@uppy/instagram')

uppy.use(Instagram, {
  // Options
})
```

[Try live!](/examples/dashboard/)

## Installation

> If you are using the `uppy` package, you do not need to install this plugin manually.

This plugin is published as the `@uppy/instagram` package.

Install from NPM:

```shell
npm install @uppy/instagram
```

In the [CDN package](/docs/#With-a-script-tag), it is available on the `Uppy` global object:

```js
const Instagram = Uppy.Instagram
```

## Options

The Instagram plugin has the following configurable options:

```js
uppy.use(Instagram, {
  target: Dashboard,
  serverUrl: 'https://server.uppy.io/',
})
```

### `id: 'Instagram'`

A unique identifier for this plugin. It defaults to `'Instagram'`.

### `target: null`

DOM element, CSS selector, or plugin to mount the Instagram provider into. This should normally be the Dashboard.

### `serverUrl: null`

URL to an [Uppy Server](/docs/server) instance.

### `serverHeaders: {}`

Custom headers that should be sent along to [Uppy Server](/docs/server) on every request.

### `serverPattern: serverUrl`

The valid and authorised URL(s) from which OAuth responses should be accepted.

This value can be a `String`, a `Regex` pattern, or an `Array` of both.

This is useful when you have your [Uppy Server](/docs/server) running on multiple hosts. Otherwise, the default value should be good enough.

### `locale: {}`

Localize text that is shown to the user.

The default English strings are:

```js
strings: {
  // TODO
}
```
