---
type: docs
order: 22
title: "StatusBar"
permalink: docs/statusbar/
---

The StatusBar shows upload progress and speed, ETAs, pre- and post-processing information, and allows users to control (pause/resume/cancel) the upload.
Best used together with a simple file source plugin, such as [FileInput][] or [DragDrop][], or a custom implementation.

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
      uploadComplete: 'Upload complete',
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

### `target: null`

DOM element, CSS selector, or plugin to mount the StatusBar into.

### `hideAfterFinish: true`

Hide StatusBar after upload finish

[FileInput]: https://github.com/transloadit/uppy/blob/master/src/plugins/FileInput.js
[DragDrop]: /docs/dragdrop
