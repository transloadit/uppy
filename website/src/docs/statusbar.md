---
type: docs
order: 22
title: "StatusBar"
permalink: docs/status-bar/
alias: docs/statusbar/
---

The StatusBar shows upload progress and speed, ETAs, pre- and post-processing information, and allows users to control (pause/resume/cancel) the upload.
Best used together with a simple file source plugin, such as [FileInput][] or [DragDrop][], or a custom implementation.

```js
const StatusBar = require('@uppy/statusbar')

uppy.use(StatusBar, {
  // Options
})
```

[Try it live](/examples/statusbar/)

## Options

```js
uppy.use(StatusBar, {
  target: 'body',
  hideUploadButton: false,
  showProgressDetails: false,
  hideAfterFinish: true
  locale: {}
})
```

### `id: 'StatusBar'`

A unique identifier for this StatusBar. Defaults to `'StatusBar'`. Use this if you need to add multiple StatusBar instances.

### `target: null`

DOM element, CSS selector, or plugin to mount the StatusBar into.

### `hideAfterFinish: true`

Hide StatusBar after upload is complete.

### `showProgressDetails: false`

By default, progress in StatusBar is shown as simple percentage. If you’d like to also display remaining upload size and time, set this to `true`.

`showProgressDetails: false`: Uploading: 45%
`showProgressDetails: true`: Uploading: 45%・43 MB of 101 MB・8s left

### `locale: {}`

Localize text that is shown to the user.

The default English strings are:

```js
strings: {
  // Shown in the status bar while files are being uploaded.
  uploading: 'Uploading',
  // Shown in the status bar once all files have been uploaded.
  complete: 'Complete',
  // Shown in the status bar if an upload failed.
  uploadFailed: 'Upload failed',
  // Shown next to `uploadFailed`.
  pleasePressRetry: 'Please press Retry to upload again',
  // Shown in the status bar while the upload is paused.
  paused: 'Paused',
  error: 'Error',
  // Used as the label for the button that retries an upload.
  retry: 'Retry',
  // Used as the label for the button that cancels an upload.
  cancel: 'Cancel',
  // Used as the screen reader label for the button that retries an upload.
  retryUpload: 'Retry upload',
  // Used as the screen reader label for the button that pauses an upload.
  pauseUpload: 'Pause upload',
  // Used as the screen reader label for the button that resumes a paused upload.
  resumeUpload: 'Resume upload',
  // Used as the screen reader label for the button that cancels an upload.
  cancelUpload: 'Cancel upload',
  // When `showProgressDetails` is set, shows the number of files that have been fully uploaded so far.
  filesUploadedOfTotal: {
    0: '%{complete} of %{smart_count} file uploaded',
    1: '%{complete} of %{smart_count} files uploaded'
  },
  // When `showProgressDetails` is set, shows the amount of bytes that have been uploaded so far.
  dataUploadedOfTotal: '%{complete} of %{total}',
  // When `showProgressDetails` is set, shows an estimation of how long the upload will take to complete.
  xTimeLeft: '%{time} left',
  // Used as the label for the button that starts an upload.
  uploadXFiles: {
    0: 'Upload %{smart_count} file',
    1: 'Upload %{smart_count} files'
  },
  // Used as the label for the button that starts an upload, if another upload has been started in the past
  // and new files were added later.
  uploadXNewFiles: {
    0: 'Upload +%{smart_count} file',
    1: 'Upload +%{smart_count} files'
  }
}
```

### `replaceTargetContent: false`

Remove all children of the `target` element before mounting the StatusBar. By default, Uppy will append any UI to the `target` DOM element. This is the least dangerous option. However, you may have some fallback HTML inside the `target` element in case JavaScript or Uppy is not available. In that case you can set `replaceTargetContent: true` to clear the `target` before appending.

[FileInput]: https://github.com/transloadit/uppy/blob/master/src/plugins/FileInput.js
[DragDrop]: /docs/dragdrop
