---
type: docs
order: 70
title: "Form"
module: "@uppy/form"
permalink: docs/form/
---

The `@uppy/form` plugin has several features to integrate with HTML `<form>` elements.

- It collects user-specified metadata from form fields, right before Uppy begins uploading/processing files.
- It can append upload results back to the form as a hidden field. Currently the appended result is a stringified version of a [`result`](docs/uppy/#uppy-upload) returned from `uppy.upload()` or `complete` event.

```js
const Form = require('@uppy/form')

uppy.use(Form, {
  // Options
})
```

## Installation

This plugin is published as the `@uppy/form` package.

Install from NPM:

```shell
npm install @uppy/form
```

In the [CDN package](/docs/#With-a-script-tag), it is available on the `Uppy` global object:

```js
const Form = Uppy.Form
```

## Options

The Form plugin has the following configurable options:

```js
uppy.use(Form, {
  target: null,
  getMetaFromForm: true,
  addResultToForm: true,
  resultName: 'uppyResult',
  submitOnSuccess: false
})
```

### `id: 'Form'`

A unique identifier for this Form. It defaults to `'Form'`.

### `target: null`

DOM element or CSS selector for the form element. This is required for the plugin to work.

### `getMetaFromForm: true`

Configures whether or not to extract metadata from the form. When set to true, the `Form` plugin will extract all fields from a `<form>` element before upload begins. Those fields will then be added to global `uppy.state.meta` and each file’s meta, and appended as (meta)data to the upload in an object with `[file input name attribute]` -> `[file input value]` key/values.

### `addResultToForm: true`

Configures whether or not to add upload/encoding results back to the form in an `<input name="uppyResult" type="hidden">` element.

### `resultName: 'uppyResult'`

The `name` attribute for the `<input type="hidden">` where the result will be added.

### `submitOnSuccess: false`

Configures whether or not to submit the form after Uppy finishes uploading/encoding.
