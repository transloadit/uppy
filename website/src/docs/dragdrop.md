---
type: docs
order: 7
title: "DragDrop"
permalink: docs/dragdrop/
---

DragDrop renders a simple Drag and Drop area for file selection. Useful when you only want local device as a file source, don’t need file previews and metadata editing UI, and the [Dashboard](/docs/dashboard/) feels like an overkill.

[Try it live](/examples/dragdrop/)

## Options

```js
uppy.use(DragDrop, {
  target: '.UppyDragDrop',
  getMetaFromForm: true,
  locale: {
    strings: {
      chooseFile: 'Choose a file',
      orDragDrop: 'or drop it here',
      upload: 'Upload',
      selectedFiles: {
        0: '%{smart_count} file selected',
        1: '%{smart_count} files selected'
      }
    }
  }
})
```

### `target: '.UppyDragDrop'`

### `getMetaFromForm: true`

### `locale`

