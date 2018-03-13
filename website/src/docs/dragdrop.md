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
  note: '',
  locale: {
    strings: {
      dropHereOr: 'Drop files here or',
      browse: 'browse'
    }
  }
})
```

### `note: null`

Optionally specify a string of text that explains something about the upload for the user. This is a place to explain `restrictions` that are put in place. For example: `'Images and video only, 2–3 files, up to 1 MB'`.

