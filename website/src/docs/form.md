---
type: docs
order: 30
title: "Form"
permalink: docs/form/
---

Form plugin collects metadata from any specified `<form>` element, right before Uppy begins uploading/processing files. And then optionally appends results back to the form. Currently the appended result is a stringified version of a [`result`](docs/uppy/#uppy-upload) returned from `uppy.upload()` or `complete` event.

## Options

```js
uppy.use(Form, {
  target: null,
  getMetaFromForm: true,
  addResultToForm: true,
  resultName: 'uppyResult',
  submitOnSuccess: false
})
```

### `target: null`

DOM element or CSS selector for the form element. Required for the plugin to work.

### `getMetaFromForm: true`

Whether to extract metadata from the form. When set to true, `Form` plugin will extract all fields from a `<form>` element before upload begins. Those fields will then be added to global `uppy.state.meta` and each file’s meta, and appended as (meta)data to the upload in an object with `[file input name attribute]` -> `[file input value]` key/values.

### `addResultToForm: true`

Whether to add upload/encoding results back to the form in an `<input name="uppyResult" type="hidden">` element.

### `resultName: 'uppyResult'`

The `name` attribute for the `<input type="hidden">` where the result will be added. 

### `submitOnSuccess: false`

Whether to submit the form after Uppy finishes uploading/encoding.
