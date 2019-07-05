---
type: docs
order: 2
title: "Informer"
module: "@uppy/informer"
permalink: docs/informer/
category: 'UI Elements'
tagline: show notifications
---

The `@uppy/informer` plugin is a pop-up bar for showing notifications. When plugins have some exciting news (or error) to share, they can show a notification here.

Informer gets its data from `uppy.state.info`, which is updated by various plugins via [`uppy.info`](https://uppy.io/docs/uppy/#uppy-info) method.

```js
const Informer = require('@uppy/informer')

uppy.use(Informer, {
  // Options
})
```

<a class="TryButton" href="/examples/dashboard/">Try it live</a>

The Informer plugin is included in the Dashboard by default.

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

The `@uppy/informer` plugin requires the following CSS for styling:

```js
import '@uppy/core/dist/style.css'
import '@uppy/informer/dist/style.css'
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the Informer styles from `@uppy/informer/dist/style.css`. A minified version is also available as `style.min.css` at the same path. The way to do import depends on your build system.

⚠️ If you use the [`@uppy/dashboard`](/docs/dashboard) plugin, you do not need to include the styles for the Progress Bar, because the Dashboard already includes it.

## Options

The `@uppy/informer` plugin has the following configurable options:

### `id: 'Informer'`

A unique identifier for this plugin. It defaults to `'Informer'`. Use this if you need multiple Informer instances.

### `target: null`

DOM element, CSS selector, or plugin to mount the Informer into.

### `replaceTargetContent: false`

Remove all children of the `target` element before mounting the Informer. By default, Uppy will append any UI to the `target` DOM element. This is the least dangerous option. However, you may have some fallback HTML inside the `target` element in case JavaScript or Uppy is not available. In that case, you can set `replaceTargetContent: true` to clear the `target` before appending.
