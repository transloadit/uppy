---
type: docs
order: 25
title: "FileInput"
permalink: docs/fileinput/
---

`FileInput` is the most barebones UI for selecting files—it shows a single button that, when clicked, opens up the browser's file selector.

[Try it live](/examples/xhrupload) - The XHRUpload example uses a `FileInput`.

## Options

```js
uppy.use(FileInput, {
  target: '.UppyForm',
  multipleFiles: true,
  pretty: true,
  inputName: 'files[]',
  locale: {
    strings: {
      selectToUpload: 'Select to upload'
    }
  }
})
```

### `target: null`

DOM element, CSS selector, or plugin to mount the file input into.

### `multipleFiles: true`

Whether to allow the user to select multiple files at once.

### `pretty: true`

When true, display a styled button (see [example](/examples/xhrupload)) that, when clicked, opens the file selector UI. When false, a plain old browser `<input type="file">` element is shown.

### `inputName: 'files[]'`

The `name` attribute for the `<input type="file">` element.

### `locale: {}`

Custom text to show on the button when `pretty` is true. There is only one string that can be configured: `strings.selectToUpload`.
