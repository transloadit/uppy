---
type: docs
order: 22
title: "StatusBar"
permalink: docs/statusbar/
---

The StatusBar shows upload progress and speed, ETAs, pre- and post-processing information, and allows users to control (pause/resume/cancel) the upload.
Best used together with a simple file source plugin, such as [FileInput][] or [DragDrop][], or a custom implementation.

```js
const StatusBar = require('uppy/lib/plugins/StatusBar')

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
  locale: {
    strings: {
      uploading: 'Uploading',
      complete: 'Complete',
      uploadFailed: 'Upload failed',
      pleasePressRetry: 'Please press Retry to upload again',
      paused: 'Paused',
      error: 'Error',
      retry: 'Retry',
      pressToRetry: 'Press to retry',
      retryUpload: 'Retry upload',
      resumeUpload: 'Resume upload',
      cancelUpload: 'Cancel upload',
      pauseUpload: 'Pause upload',
      filesUploadedOfTotal: {
        0: '%{complete} of %{smart_count} file uploaded',
        1: '%{complete} of %{smart_count} files uploaded'
      },
      dataUploadedOfTotal: '%{complete} of %{total}',
      xTimeLeft: '%{time} left',
      uploadXFiles: {
        0: 'Upload %{smart_count} file',
        1: 'Upload %{smart_count} files'
      },
      uploadXNewFiles: {
        0: 'Upload +%{smart_count} file',
        1: 'Upload +%{smart_count} files'
      }
    }
  }
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

### `replaceTargetContent: false`

Remove all children of the `target` element before mounting the StatusBar. By default, Uppy will append any UI to the `target` DOM element. This is the least dangerous option. However, you may have some fallback HTML inside the `target` element in case JavaScript or Uppy is not available. In that case you can set `replaceTargetContent: true` to clear the `target` before appending.

[FileInput]: https://github.com/transloadit/uppy/blob/master/src/plugins/FileInput.js
[DragDrop]: /docs/dragdrop
