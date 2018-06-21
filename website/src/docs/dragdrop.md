---
type: docs
order: 21
title: "DragDrop"
permalink: docs/drag-drop/
alias: docs/dragdrop/
---

DragDrop renders a simple Drag and Drop area for file selection. Useful when you only want the local device as a file source, don’t need file previews and metadata editing UI, and the [Dashboard](/docs/dashboard/) feels like an overkill.

```js
const DragDrop = require('@uppy/drag-drop')

uppy.use(DragDrop, {
  // Options
})
```

[Try it live](/examples/dragdrop/)

## Options

```js
uppy.use(DragDrop, {
  target: null,
  width: '100%',
  height: '100%',
  note: null,
  locale: {}
})
```

> Note that certain [restrictions set in Uppy’s main options](/docs/uppy#restrictions), namely `maxNumberOfFiles` and `allowedFileTypes`, affect the system file picker dialog. If `maxNumberOfFiles: 1`, users will only be able to select one file, and `allowedFileTypes: ['video/*', '.gif']` means only videos or gifs (files with `.gif` extension) will be selectable.

### `id: 'DragDrop'`

A unique identifier for this DragDrop. Defaults to `'DragDrop'`. Use this if you need to add multiple DragDrop instances.

### `target: null`

DOM element, CSS selector, or plugin to place the drag and drop area into.

### `width: '100%'`

Drag and drop area width, set in inline CSS, so feel free to use percentage, pixels or other values that you like.

### `height: '100%'`

Drag and drop area height, set in inline CSS, so feel free to use percentage, pixels or other values that you like.

### `note: null`

Optionally specify a string of text that explains something about the upload for the user. This is a place to explain `restrictions` that are put in place. For example: `'Images and video only, 2–3 files, up to 1 MB'`.

### `locale: {}`

Localize text that is shown to the user.

The default English strings are:

```js
strings: {
  // Text to show on the droppable area.
  // `%{browse}` is replaced with a link that opens the system file selection dialog.
  dropHereOr: 'Drop here or %{browse}',
  // Used as the label for the link that opens the system file selection dialog.
  browse: 'browse'
}
```
