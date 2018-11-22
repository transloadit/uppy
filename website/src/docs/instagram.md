---
type: docs
order: 33
title: "Instagram"
module: "@uppy/instagram"
permalink: docs/instagram/
---

The `@uppy/instagram` plugin lets users import files from their Instagram account.

A Companion instance is required for the `@uppy/instagram` plugin to work. Companion handles authentication with Instagram, downloads the pictures and videos, and uploads them to the destination. This saves the user bandwidth, especially helpful if they are on a mobile connection.

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

## CSS

Dashboard plugin is recommended as a container to all Provider plugins, including Instagram. If you are using Dashboard, it [comes with all the nessesary styles](/docs/dashboard/#CSS) for Dropbox as well.

⚠️ If you are feeling adventerous, and want to use Instagram plugin separately, without Dashboard, make sure to include `@uppy/provider-views/dist/style.css` (or `style.min.css`) CSS file. This is experimental, not officialy supported and not recommened.

## Options

The `@uppy/instagram` plugin has the following configurable options:

```js
uppy.use(Instagram, {
  target: Dashboard,
  serverUrl: 'https://companion.uppy.io/',
})
```

### `id: 'Instagram'`

A unique identifier for this plugin. It defaults to `'Instagram'`.

### `title: 'Instagram'`

Configures the title / name shown in the UI, for instance, on Dashboard tabs. It defaults to `'Instagram'`.

### `target: null`

DOM element, CSS selector, or plugin to mount the Instagram provider into. This should normally be the Dashboard.

### `serverUrl: null`

URL to a [Companion](/docs/companion) instance.

### `serverHeaders: {}`

Custom headers that should be sent along to [Companion](/docs/companion) on every request.

### `serverPattern: serverUrl`

The valid and authorised URL(s) from which OAuth responses should be accepted.

This value can be a `String`, a `Regex` pattern, or an `Array` of both.

This is useful when you have your [Companion](/docs/companion) running on multiple hosts. Otherwise, the default value should be good enough.

### `locale: {}`

Localize text that is shown to the user.

The default English strings are:

```js
strings: {
  // TODO
}
```
