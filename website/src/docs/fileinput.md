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
  target: null,
  pretty: true,
  inputName: 'files[]',
  locale: {
    strings: {
      chooseFiles: 'Choose files'
    }
  }
})
```

> Note that certain [restrictions set in Uppy’s main options](/docs/uppy#restrictions), namely `maxNumberOfFiles` and `allowedFileTypes`, affect the system file picker dialog. If `maxNumberOfFiles: 1`, users will only be able to select one file, and `allowedFileTypes: ['video/*', '.gif']` means only videos or gifs (files with `.gif` extension) will be selectable.

### `target: null`

DOM element, CSS selector, or plugin to mount the file input into.

### `pretty: true`

When true, display a styled button (see [example](/examples/xhrupload)) that, when clicked, opens the file selector UI. When false, a plain old browser `<input type="file">` element is shown.

### `inputName: 'files[]'`

The `name` attribute for the `<input type="file">` element.

### `locale: {}`

Custom text to show on the button when `pretty` is true.
