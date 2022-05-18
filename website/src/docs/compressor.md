---
type: docs
order: 10
title: "Compressor"
module: "@uppy/compressor"
permalink: docs/compressor/
category: "Miscellaneous"
tagline: "optimizes images before upload, saving up to 60% on average"
---

The Compressor plugin for Uppy optimizes images (JPEG, PNG), saving on average up to 60% in size (roughly 18 MB for 10 images). It uses [Compressor.js](https://github.com/fengyuanchen/compressorjs).

```js
import Uppy from '@uppy/core'
import Compressor from '@uppy/compressor'

const uppy = new Uppy()
uppy.use(Compressor)
```

## Installation

This plugin is published as the `@uppy/compressor` package.

```shell
npm install @uppy/compressor
```

In the [CDN package](/docs/#With-a-script-tag), the plugin class is available on the `Uppy` global object:

```js
const { Compressor } = Uppy
```

## Options

The `@uppy/compressor` plugin has the following configurable options:

```js
uppy.use(Compressor, {
  quality: 0.6,
  limit: 10,
})
```

You can also pass any of the [Compressor.js options](https://github.com/fengyuanchen/compressorjs#options) here.

### `id`

* Type: `string`
* Default: `Compressor`

A unique identifier for this plugin. It defaults to `'Compressor'`.

### `quality`

* Type: `number`
* Default: `0.6`

This option is passed to [Compressor.js](https://github.com/fengyuanchen/compressorjs).

The quality of the output image. It must be a number between `0` and `1`. Be careful to use `1` as it may make the size of the output image become larger.

> **Note:** This option is only available for `image/jpeg` and `image/webp` images.

### `limit`

* Type: `number`
* Default: `10`

Number of images that will be compressed in parallel. You likely don’t need to change this, unless you are experiencing performance issues.

## Event

`compressor:complete` event is emitted when all files are compressed.
