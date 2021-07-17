---
type: docs
order: 0
title: "Form"
module: "@uppy/form"
permalink: docs/form/
category: "Miscellaneous"
tagline: "collect metadata from <code>&lt;form&gt;</code> right before the Uppy upload, then optionally append results back to the form"
---

The `@uppy/form` plugin has several features to integrate with HTML `<form>` elements.

*   It collects user-specified metadata from form fields, right before Uppy begins uploading/processing files.
*   It can append upload results back to the form as a hidden field. Currently the appended result is a stringified version of a [`result`](/docs/uppy/#uppy-upload) returned from `uppy.upload()` or `complete` event.

```js
import Form from '@uppy/form'

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
const { Form } = Uppy
```

## Options

The `@uppy/form` plugin has the following configurable options:

```js
uppy.use(Form, {
  target: null,
  resultName: 'uppyResult',
  getMetaFromForm: true,
  addResultToForm: true,
  submitOnSuccess: false,
  triggerUploadOnSubmit: false,
})
```

### `id: 'Form'`

A unique identifier for this plugin. It defaults to `'Form'`.

### `target: null`

DOM element or CSS selector for the form element. This is required for the plugin to work.

### `resultName: 'uppyResult'`

The `name` attribute for the `<input type="hidden">` where the result will be added.

### `getMetaFromForm: true`

Configures whether or not to extract metadata from the form. When set to true, the `Form` plugin will extract all fields from a `<form>` element before upload begins. Those fields will then be added to global `uppy.state.meta` and each file’s meta, and appended as (meta)data to the upload in an object with `[file input name attribute]` -> `[file input value]` key/values.

### `addResultToForm: true`

Configures whether or not to add upload/encoding results back to the form in an `<input name="uppyResult" type="hidden">` element.

### `triggerUploadOnSubmit: false`

Configures whether or not to start the upload when the form is submitted. When the user presses a submit button, this will prevent form submission, and instead upload files. You can then:

*   use `submitOnSuccess: true` if you need the form to *actually* be submitted once all files have been uploaded.
*   listen for `uppy.on('complete')` to do something else if the file uploads are all you need. For example, if the form is used for file metadata only.

### `submitOnSuccess: false`

Configures whether or not to submit the form after Uppy finishes uploading/encoding.
