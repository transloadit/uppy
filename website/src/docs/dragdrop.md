---
type: docs
order: 1
title: "Drag & Drop"
module: "@uppy/drag-drop"
permalink: docs/drag-drop/
alias: docs/dragdrop/
category: "Sources"
tagline: "plain and simple drag-and-drop area"
---

The `@uppy/drag-drop` plugin renders a simple drag and drop area for file selection. it can be useful when you only want the local device as a file source, don’t need file previews and a UI for metadata editing, and the [Dashboard](/docs/dashboard/) feels like overkill.

```js
import DragDrop from '@uppy/drag-drop'

uppy.use(DragDrop, {
  // Options
})
```

<a class="TryButton" href="/examples/dragdrop/">Try it live</a>

## Installation

This plugin is published as the `@uppy/drag-drop` package.

Install from NPM:

```shell
npm install @uppy/drag-drop
```

In the [CDN package](/docs/#With-a-script-tag), it is available on the `Uppy` global object:

```js
const { DragDrop } = Uppy
```

## CSS

The `@uppy/drag-drop` plugin includes some simple styles, like shown in the [example](/examples/dragdrop). You can also choose not to use it and provide your own styles instead.

```js
import '@uppy/core/dist/style.css'
import '@uppy/drag-drop/dist/style.css'
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the Drag & Drop styles from `@uppy/drag-drop/dist/style.css`. A minified version is also available as `style.min.css` at the same path. The way to do import depends on your build system.

## Options

The `@uppy/drag-drop` plugin has the following configurable options:

```js
uppy.use(DragDrop, {
  target: null,
  width: '100%',
  height: '100%',
  note: null,
  locale: {},
})
```

> Note that certain [restrictions set in Uppy’s main options](/docs/uppy#restrictions), namely `maxNumberOfFiles` and `allowedFileTypes`, affect the system file picker dialog. If `maxNumberOfFiles: 1`, users will only be able to select one file, and `allowedFileTypes: ['video/*', '.gif']` means only videos or gifs (files with `.gif` extension) will be selectable.

### `id: 'DragDrop'`

A unique identifier for this plugin. It defaults to `'DragDrop'`. Use this if you need to add multiple DragDrop instances.

### `target: null`

DOM element, CSS selector, or plugin to place the drag and drop area into.

### `width: '100%'`

Drag and drop area width, set in inline CSS, so feel free to use percentage, pixels or other values that you like.

### `height: '100%'`

Drag and drop area height, set in inline CSS, so feel free to use percentage, pixels or other values that you like.

### `note: null`

Optionally, specify a string of text that explains something about the upload for the user. This is a place to explain any `restrictions` that are put in place. For example: `'Images and video only, 2–3 files, up to 1 MB'`.

### `locale: {}`

Localize text that is shown to the user.

### `onDragOver(event)`

Callback for the [`ondragover`][ondragover] event handler.

### `onDragLeave(event)`

Callback for the [`ondragleave`][ondragleave] event handler.

### `onDrop(event)`

Callback for the [`ondrop`][ondrop] event handler.

The default English strings are:

```js
const strings = {
  // Text to show on the droppable area.
  // `%{browse}` is replaced with a link that opens the system file selection dialog.
  dropHereOr: 'Drop here or %{browse}',
  // Used as the label for the link that opens the system file selection dialog.
  browse: 'browse',
}
```

<!-- definitions -->

[ondragover]: https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/ondragover

[ondragleave]: https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/ondragleave

[ondrop]: https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/ondrop
