---
type: docs
order: 52
title: "Informer"
permalink: docs/informer/
---

The Informer plugin is a pop-up bar for showing notifications. When plugins have some exciting news (or error) to share, they can show a notification here.

```js
const Informer = require('@uppy/informer')

uppy.use(Informer, {
  // Options
})
```

[Try it live](/examples/dashboard/) - The Informer plugin is included in the Dashboard by default.

## Installation

> If you are using the `uppy` package, you do not need to install this plugin manually.

This plugin is published as the `@uppy/informer` package.

Install from NPM:

```shell
npm install @uppy/informer
```

In the [CDN package](/docs/#With-a-script-tag), it is available on the `Uppy` global object:

```js
const Informer = Uppy.Informer
```

## CSS

The Informer plugin includes CSS a file for styling. If you use the [`@uppy/dashboard`](/docs/dashboard) plugin, you do not need to include the styles for the Informer, because the Dashboard already includes it.

The CSS file lives at `@uppy/informer/dist/style.css`. A minified version is at `@uppy/informer/dist/style.min.css`.

Import one of these files into your project. The way to do this depends on your build system.

## Options

The Informer plugin has the following configurable options:

### `id: 'Informer'`

A unique identifier for this Informer. It defaults to `'Informer'`. Use this if you need multiple Informer instances.

### `target: null`

DOM element, CSS selector, or plugin to mount the informer into.

### `typeColors: {}`

Customize the background and foreground colors for different types of notifications. Supported types are `info`, `warning`, `error`, and `success`. To customize colors, pass an object containing `{ bg, text }` color pairs for each type of notification:

```js
uppy.use(Informer, {
  typeColors: {
    info:    { text: '#fff', bg: '#000000' },
    warning: { text: '#fff', bg: '#f6a623' },
    error:   { text: '#fff', bg: '#e74c3c' },
    success: { text: '#fff', bg: '#7ac824' }
  }
})
```

### `replaceTargetContent: false`

Remove all children of the `target` element before mounting the Informer. By default, Uppy will append any UI to the `target` DOM element. This is the least dangerous option. However, you may have some fallback HTML inside the `target` element in case JavaScript or Uppy is not available. In that case, you can set `replaceTargetContent: true` to clear the `target` before appending.
