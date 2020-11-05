---
type: docs
order: 2
title: "Image Editor"
module: "@uppy/image-editor"
permalink: docs/image-editor/
category: "File Processing"
tagline: "allows users to crop, rotate, zoom and flip images that are added to Uppy"
---

`@uppy/image-editor` allows users to crop, rotate, zoom and flip images that are added to Uppy.

Designed to be used with the Dashboard UI (can in theory work without it).

⚠ In beta.

![Screenshor of the Image Editor plugin UI in Dashboard](https://user-images.githubusercontent.com/1199054/87208710-654db400-c307-11ea-9471-6e3c6582d2a5.png)

```js
const Uppy = require('@uppy/core')
const Dashboard = require('@uppy/dashboard')
const ImageEditor = require('@uppy/image-editor')

const uppy = new Uppy()
uppy.use(Dashboard)
uppy.use(ImageEditor, {
  target: Dashboard,
  quality: 0.8
})
```

## Installation

This plugin is published as the `@uppy/image-editor` package.

Install from NPM:

```shell
npm install @uppy/image-editor
```

The `@uppy/image-editor` plugin is in beta and is not yet available in the [CDN package](/docs/#With-a-script-tag).

## CSS

The `@Uppy/image-editor` plugin requires the following CSS for styling:

```js
import '@uppy/image-editor/dist/style.css'
```

A minified version is also available as `style.min.css` at the same path.  Include this import after your import of the core stylesheet and the dashboard stylesheet.

## Options

The `@uppy/image-editor` plugin has the following configurable options:

```js
uppy.use(ImageEditor, {
  id: 'ImageEditor',
  quality: 0.8,
  cropperOptions: {
    viewMode: 1,
    background: false,
    autoCropArea: 1,
    responsive: true
  },
  actions: {
    revert: true,
    rotate: true,
    flip: true,
    zoomIn: true,
    zoomOut: true,
    cropSquare: true,
    cropWidescreen: true,
    cropWidescreenVertical: true
  }
})
```

### `id: 'ImageEditor'`

A unique identifier for this plugin. It defaults to `'ThumbnailGenerator'`.

### `quality: 0.8`

Quality of the resulting blob that will be saved in Uppy after editing/cropping.

### `cropperOptions`

Image Editor is using the excellent [Cropper.js](https://fengyuanchen.github.io/cropperjs/), and if you’d like to fine tune the Cropper.js instance, you can pass options to it.

### `actions`

Image Editor actions buttons, which will be shown. If you you’d like to hide any action pass `false` to it. By default all the actions are visible.

## Events

### file-editor:start

Emitted when `selectFile(file)` is called.

```js
uppy.on('file-editor:start', (file) => {
  console.log(file)
})
```

### file-editor:complete

Emitted after `save(blob)` is called.

```js
uppy.on('file-editor:complete', (updatedFile) => {
  console.log(updatedFile)
})
```
