---
type: docs
title: "Robodog: Form API"
menu: "Robodog Form"
permalink: docs/robodog/form/
order: 2
category: "File Processing"
---

Add resumable uploads and Transloadit's processing to your existing HTML upload forms. Selected files will be uploaded to Transloadit, and the Assembly information will be submitted to your form endpoint.

```html
<form id="upload-form" method="POST" action="/upload">
  <input type="file" multiple>
  ...
</form>

<script>
window.Robodog.form('form#upload-form', {
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

All the options to the [Transloadit][transloadit plugin] plugin are supported.

## Locale

You can localize the “Choose files” button that is injected into the form, by setting the `locale.strings` option:

```js
locale: {
  strings: {
    chooseFiles: 'Choose files'
  }
}
```

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

Uploads using HTML forms have no builtin progress reporting. With Robodog, you can use the `statusBar` option to show an [@uppy/status-bar](/docs/status-bar): an element styled like a progress bar, reporting both upload and Assembly execution progress.

Point it to an element or a CSS selector:

```html
<form id="upload-form" ...>
  <div class="progress"></div>
</form>
<script>
window.Robodog.form('form#upload-form', {
  statusBar: '#upload-form .progress'
  // ...
})
</script>
```

The progress bar will be inserted _into_ that element (thus _not_ replace it).

## Separating Uploads from Form Submission

By default, `Robodog.form` starts uploads when the user submits the form. There can be a use case for _not_ doing this, and instead uploading files in response to some user action, _before_ the form is submitted. For example, when using a Dashboard modal, the user can upload their files first and then return to the form to submit it. When they submit the form, it should not start uploading again.

The `triggerUploadOnSubmit: false` option is available for this purpose. We recommend using it together with the `modal: true` and `closeAfterFinish: true` options:

```js
// Replace file input in #upload-form with a button that opens the modal;
// after the user clicks the "Upload" button inside the modal and all
// files have been successfully uploaded, the modal closes and the user
// can submit the form.
window.Robodog.form('form#upload-form', {
  modal: true,
  closeAfterFinish: true,
  triggerUploadOnSubmit: false
})
```

## Migrating From the jQuery SDK

We now recommend using Uppy over the jQuery SDK. Uppy is framework- and library-agnostic, and much more extensible.

Like the Transloadit jQuery SDK, this API enhances an existing form. That makes this a good candidate for migration. Most of the jQuery SDK options have a direct equivalent in Robodog.

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
<!-- The new Robodog way! -->
<script src="//transloadit.edgly.net/releases/uppy/robodog/v1.5.2/robodog.min.js"></script>

<script>
window.Robodog.form(selector, {
  ...options
})
</script>
```

Make sure to also include the Uppy css file in your `<head>` tag in case you want to use the `modal: true` option:
```html
<head>
  <link rel="stylesheet" href="https://transloadit.edgly.net/releases/uppy/robodog/v1.5.2/robodog.min.css">
</head>
```

Here is a full copy-pasteable code sample with all updated options and event names and how to use them. Please refer to the explanations below the code sample for details.
Notice how the form is submitted to the inexistant `/uploads` route once all transcoding is finished. Please do not forget to add your Transloadit auth key to
`window.YOUR_TRANSLOADIT_AUTH_KEY`.

```js
<html>
  <head>
    <title>Testing Robodog</title>
    <link rel="stylesheet" href="https://transloadit.edgly.net/releases/uppy/robodog/v1.5.2/robodog.min.css">
  </head>
  <body>
    <form id="upload-form" action="/uploads" enctype="multipart/form-data" method="POST">
      <input type="file" name="my_file" multiple="multiple" />
      <input type="text" name="album_id" value="my_album_id" placeholder="Album ID" />
      <input type="text" name="song_id" value="my_song_id" placeholder="Song ID" />
      <button type="submit">Upload</button>
    </form>

    <script src="https://transloadit.edgly.net/releases/uppy/robodog/v1.5.2/robodog.min.js"></script>
    <script type="text/javascript">
    window.Robodog.form('#upload-form', {
      waitForEncoding: true,
      waitForMetadata: true,

      modal: true,

      alwaysRunAssembly: true,
      submitOnSuccess: true,
      autoProceed: true,

      fields: ['album_id'],
      params: {
        auth: { key: window.YOUR_TRANSLOADIT_AUTH_KEY },
        steps: {
          resize_to_75: {
            robot: "/image/resize",
            use: ":original",
            width: 75,
            height: 75
          }
        }
      }
    })
    .on('transloadit:assembly-created', (assembly) => {
      console.log(">>> onStart", assembly);
    })
    .on('upload-progress', (bytesIn, totalBytes) => {
      console.log(">>> onProgress", bytesIn, totalBytes);
    })
    .on('transloadit:complete', (assembly) => {
      console.log('>> onSuccess: Assembly finished successfully with', assembly.ok);
    })
    .on('transloadit:assembly-executing', () => {
      console.log('>> Uploading finished!');
    })
    .on('transloadit:upload', (uploadedFile) => {
      console.log('>> Upload added', uploadedFile);
    })
    .on('transloadit:result', (stepName, result) => {
      console.log('>> Result added', stepName, result);
    })
    .on('error', (error) => {
      console.log('>> Assembly got an error:', error);
      if (error.assembly) {
        console.log(`>> Assembly ID ${error.assembly.assembly_id} failed!`);
        console.log(error.assembly);
      }
    });
    </script>
  </body>
</html>
```

The equivalent options are listed below.

### Options

| jQuery SDK option | Robodog option |
|---------------|---------------------------|
| `service` | `service` |
| `region` | Not supported, instead set the `service` option to `https://api2-regionname.transloadit.com` |
| `wait: true` | `waitForEncoding: true` |
| `requireUploadMetadata: true` | `waitForMetadata: true` |
| `params` | `params` |
| `signature` | `signature` |
| `modal` | `modal` |
| `autoSubmit` | `submitOnSuccess` |
| `triggerUploadOnFileSelection` | `autoProceed: true` |
| `processZeroFiles` | `alwaysRunAssembly` |
| `maxNumberOfUploadedFiles` | Use [restrictions](#Restrictions) instead. `restrictions.maxNumberOfFiles`. |
| `locale` | No longer supported, this will be addressed by the equivalent to the `translations` option instead. |
| `translations` | Currently unavailable |
| `exclude` | Currently unavailable |
| `fields` | `fields`. The CSS selector format is no longer supported. Instead, specify an array of form field names. `['field1']` instead of `'input[name=field1]`. |
| `debug` | Obsolete, as Transloadit's backend has improved error reporting. |

As for the options that are unavailable:

- `exclude` is intended to exclude certain `<input type="file">` inputs from Transloadit processing. It will likely not be added, but we'll perhaps have a `include` CSS selector option instead.
- `debug` will not be added.

### Events

There are no `on*()` _options_ anymore, but `.on('...')` methods are provided instead on the Uppy object that is returned by `window.Robodog.form()`.

| jQuery SDK option | Robodog Event |
|---------------|--------------------------|
| `onStart` | `.on('transloadit:assembly-created', (assembly) => {})` |
| `onExecuting` | `.on('transloadit:assembly-executing', (assembly) => {})` |
| `onFileSelect` | `.on('file-added', (file) => {})` |
| `onProgress` | `.on('progress`, (percentage) => {})) for total upload progress taking all files into account.<br />`.on('upload-progress', (file, progress) => {})` for file-specific upload progress. |
| `onUpload` | `.on('transloadit:upload', (file) => {}))` |
| `onResult` | `.on('transloadit:result', (stepName, resultFile) => {}))` |
| `onCancel` | `.on('transloadit:cancel', (assembly) => {}))`<br />or `.on('file-removed', (file) => {})` for individual files |
| `onError` | `.on('error', (error) => {})` <br /><br />The error object might contain an `.assembly` property with an Assembly status for errors that happened during the execution of the Assembly. |
| `onSuccess` | `.on('transloadit:complete', (assembly) => {})` |
| `onDisconnect` | Currently unavailable, use something like [`is-offline`](https://www.npmjs.com/package/is-offline) |
| `onReconnect` | Currently unavailable, use something like [`is-offline`](https://www.npmjs.com/package/is-offline) |

[transloadit]: https://transloadit.com
[transloadit plugin]: https://uppy.io/docs/transloadit/
