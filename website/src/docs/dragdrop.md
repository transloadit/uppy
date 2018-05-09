---
type: docs
order: 21
title: "DragDrop"
permalink: docs/dragdrop/
---

DragDrop renders a simple Drag and Drop area for file selection. Useful when you only want the local device as a file source, don’t need file previews and metadata editing UI, and the [Dashboard](/docs/dashboard/) feels like an overkill.

[Try it live](/examples/dragdrop/)

## Options

```js
uppy.use(DragDrop, {
  target: null,
  width: '100%',
  height: '100%',
  allowMultipleFiles: true,
  note: null,
  locale: {
    strings: {
      dropHereOr: 'Drop files here or',
      browse: 'browse'
    }
  }
})
```

### `target: null`

DOM element, CSS selector, or plugin to place the drag and drop area into.

### `width: '100%'`

Drag and drop area width, set in inline CSS, so feel free to use percentage, pixels or other values that you like.

### `height: '100%'`

Drag and drop area height, set in inline CSS, so feel free to use percentage, pixels or other values that you like.

### `allowMultipleFiles: true`

Whether to allow user to select multiple files at once via the system file dialog.

### `note: null`

Optionally specify a string of text that explains something about the upload for the user. This is a place to explain `restrictions` that are put in place. For example: `'Images and video only, 2–3 files, up to 1 MB'`.

