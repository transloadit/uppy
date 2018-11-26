---
type: docs
order: 12
title: "Transloadit Preset: Form API"
menu: "Form"
permalink: docs/transloadit-preset/form/
---

Add resumable uploads and Transloadit's processing to your existing HTML upload forms. Selected files will be uploaded to Transloadit, and the Assembly information will be submitted to your form endpoint.

```html
<form id="myForm" method="POST" action="/upload">
  <input type="file" multiple>
  ...
</form>

<script>
transloadit.form('form#myForm', {
  params: {
    auth: { key: '' },
    template_id: ''
  }
})
</script>
```

When the user submits the form, we intercept it and send the files to Transloadit instead. This creates one or more Assemblies depending on configuration. Then, we put the status JSON object(s) in a hidden input field named `transloadit`.

```html
<input type="hidden" name="transloadit" value='[{"ok": "ASSEMBLY_EXECUTING",...}]'>
```

Finally, we _really_ submit the form—without files, but with those Assembly status objects. You can then handle that in your backend.

## Transloadit

**TODO inline most of this?**

All the options to the [Transloadit][transloadit] plugin are supported.

## Restrictions

Set rules and conditions to limit the type and/or number of files that can be selected. Restrictions are configured by the `restrictions` option.

### `restrictions.maxFileSize`

Maximum file size in bytes for each individual file.

### `restrictions.maxNumberOfFiles`

The total number of files that can be selected. If this is larger than 1, the `multiple` attribute will be added to `<input type="file">` fields.

### `restrictions.minNumberOfFiles`

The minimum number of files that must be selected before the upload. The upload will fail and the form will not be submitted if fewer files were selected.

### `restrictions.allowedFileTypes`

Array of mime type wildcards `image/*`, exact mime types `image/jpeg`, or file extensions `.jpg`: `['image/*', '.jpg', '.jpeg', '.png', '.gif']`.

If provided, the [`<input accept>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#Limiting_accepted_file_types) attribute will be added to `<input type="file">` fields, so only acceptable files can be selected in the system file dialog.

## Progress Reporting

**TODO have an option to mount a status bar somewhere**

## Dashboard

**TODO have an option to replace the inputs with a Dashboard modal button?**

## Migrating From the jQuery SDK

We now recommend using Uppy over the jQuery SDK. Uppy is framework- and library-agnostic, and much more extensible.

Like the Transloadit jQuery SDK, this API enhances an existing form. That makes this a good candidate for migration. Most of the jQuery SDK options have a direct equivalent in the Transloadit Preset.

First, change your import URLs and initialization code:

```html
<!-- The old jQuery way… -->
<script src="//assets.transloadit.com/js/jquery.transloadit2-v3-latest.js"></script>
<script>
$(selector).transloadit({
  ...options
})
</script>
```
```html
<!-- The new Transloadit Preset way! -->
<script src="//transloadit.edgly.net/TODO_INSERT_URL.js"></script>
<script>
transloadit.form(selector, {
  ...options
})
</script>
```

The equivalent options are listed below.

### Options

| jQuery option | Transloadit Preset option |
|---------------|---------------------------|
| `service` | `service` |
| `region` | Set the `service` option to `https://api2-regionname.transloadit.com` |
| `wait: true` | `waitForEncoding: true` |
| `requireUploadMetadata: true` | `waitForMetadata: true` |
| `params` | `params` |
| `signature` | `signature` |
| `modal` | Currently unavailable |
| `autoSubmit` | `submitOnSuccess` |
| `triggerUploadOnFileSelection` | Currently unavailable |
| `processZeroFiles` | `alwaysRunAssembly` |
| `maxNumberOfUploadedFiles` | Use [restrictions](#Restrictions) instead. `restrictions.maxNumberOfFiles`. |
| `locale` | No longer supported, this will be addressed by the equivalent to the `translations` option instead. |
| `translations` | Currently unavailable |
| `exclude` | Currently unavailable |
| `fields` | `fields`. The CSS selector format is no longer supported. Instead, specify an array of form field names. `['field1']` instead of `'input[name=field1]`. |
| `debug` | Currently unavailable |

### Events

The `transloadit.form()` method returns an Uppy object, so you can listen to events there. There are no `on*()` _options_ anymore, but an `.on('*')` method is provided instead.

| jQuery option | Transloadit Preset Event |
|---------------|--------------------------|
| `onStart` | `uppy.on('transloadit:assembly-created')` |
| `onExecuting` | `uppy.on('transloadit:assembly-executing')` |
| `onFileSelect` | No longer supported, attach a listener to the DOM element instead. |
| `onProgress` | `uppy.on('upload-progress')`, then call `uppy.getState().totalProgress` |
| `onUpload` | `uppy.on('transloadit:upload')` |
| `onResult` | `uppy.on('transloadit:result')` |
| `onCancel` | `uppy.on('cancel-all')` |
| `onError` | `uppy.on('error')` |
| `onSuccess` | `uppy.on('complete')` |
| `onDisconnect` | Currently unavailable |
| `onReconnect` | Currently unavailable |

**TODO Need a simpler method to get progress, possibly a `'progress'` event that emits the result of `_calculateTotalProgress`**
