---
type: docs
order: 21
title: "DragDrop"
permalink: docs/dragdrop/
---

DragDrop renders a simple Drag and Drop area for file selection. Useful when you only want local device as a file source, don’t need file previews and metadata editing UI, and the [Dashboard](/docs/dashboard/) feels like an overkill.

[Try it live](/examples/dragdrop/)

## Options

```js
uppy.use(DragDrop, {
  target: null,
  getMetaFromForm: true,
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

