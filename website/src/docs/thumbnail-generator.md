---
type: docs
order: 2
title: "Thumbnail Generator"
module: "@uppy/thumbnail-generator"
permalink: docs/thumbnail-generator/
category: 'Miscellaneous'
---

`@uppy/thumbnail-generator` generates proportional thumbnails (file previews) for images that are added to Uppy.

This plugin is included by default with the [Dashboard](/docs/dashboard), so you don’t have to include it manually. But it is useful if you are not using the Dashboard and want to display image previews in your custom UI.

```js
const ThumbnailGenerator = require('@uppy/thumbnail-generator')

uppy.use(ThumbnailGenerator, {
  thumbnailWidth: 200,
  // thumbnailHeight: 200 // optional, use either width or height
})
```

> Now, the `file.preview` property will contain a URL to the thumbnail and `thumbnail:generated` event will be emitted, see below for details.

## Installation

This plugin is published as the `@uppy/thumbnail-generator` package.

Install from NPM:

```shell
npm install @uppy/thumbnail-generator
```

In the [CDN package](/docs/#With-a-script-tag), it is available on the `Uppy` global object:

```js
const ThumbnailGenerator = Uppy.ThumbnailGenerator
```

## Options

The `@uppy/thumbnail-generator` plugin has the following configurable options:

```js
uppy.use(ThumbnailGenerator, {
  id: 'ThumbnailGenerator',
  thumbnailWidth: 200,
  thumbnailHeight: 200
})
```

### `id: 'ThumbnailGenerator'`

A unique identifier for this plugin. It defaults to `'ThumbnailGenerator'`.

### `thumbnailWidth: 200`

Width of the resulting thumbnail. Default thumbnail dimension is 200px. Thumbnails are always proportional and not cropped. If width is provided, height is calculated automatically to match ratio.

If both width and height are given, only width is taken into account.

> uppy.use(ThumbnailGenerator, { thumbnailWidth: 300 }) will produce a 300px width thumbnail with calculated height to match ratio.

### `thumbnailHeight: null`

Height of the resulting thumbnail. Default thumbnail dimension is 200px. Thumbnails are always proportional and not cropped. If height is provided, width is calculated automatically to match ratio.

If both width and height are given, only width is taken into account.

> uppy.use(ThumbnailGenerator, { thumbnailHeight: 300 }) will produce a 300px height thumbnail with calculated width to match ratio.
>
> uppy.use(ThumbnailGenerator, { thumbnailWidth: 300, thumbnailHeight: 300 }) will produce a 300px width thumbnail with calculated height to match ratio (and ignore the given height).
>
> See https://github.com/transloadit/uppy/issues/979 and https://github.com/transloadit/uppy/pull/1096 for details on this feature.

## Event

`thumbnail:generated` event is emitted with `file` and `preview` local url as arguments:

```js
uppy.on('thumbnail:generated', (file, preview) => {
  const img = document.createElement('img')
  img.src = preview
  img.width = 100
  document.body.appendChild(img)
})
```
