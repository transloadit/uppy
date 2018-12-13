---
type: docs
order: 60
title: "Status Bar"
module: "@uppy/status-bar"
permalink: docs/status-bar/
alias: docs/statusbar/
---

The `@uppy/status-bar` plugin shows upload progress and speed, ETAs, pre- and post-processing information, and allows users to control (pause/resume/cancel) the upload.
It is best used in combination with a simple file source plugin, such as [`@uppy/file-input`][] or [`@uppy/drag-drop`][], or a custom implementation.

```js
const StatusBar = require('@uppy/status-bar')

uppy.use(StatusBar, {
  // Options
})
```

<a class="TryButton" href="/examples/statusbar/">Try it live</a>

## Installation

This plugin is published as the `@uppy/status-bar` package.

Install from NPM:

```shell
npm install @uppy/status-bar
```

In the [CDN package](/docs/#With-a-script-tag), it is available on the `Uppy` global object:

```js
const StatusBar = Uppy.StatusBar
```

## CSS

The `@uppy/status-bar` plugin requires the following CSS for styling:

```js
import '@uppy/core/dist/style.css'
import '@uppy/status-bar/dist/style.css'
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the Status Bar styles from `@uppy/status-bar/dist/style.css`. A minified version is also available as `style.min.css` at the same path. The way to do import depends on your build system.

⚠️ If you use the [`@uppy/dashboard`](/docs/dashboard) plugin, you do not need to include the styles for the Progress Bar, because the Dashboard already includes it.

## Options

The `@uppy/status-bar` plugin has the following configurable options:

```js
uppy.use(StatusBar, {
  id: 'StatusBar',
  target: 'body',
  hideAfterFinish: true,
  showProgressDetails: false,
  hideUploadButton: false,
  hideRetryButton: false,
  hidePauseResumeButton: false,
  hideCancelButton: false
  locale: {}
})
```

### `id: 'StatusBar'`

A unique identifier for this Status Bar. It defaults to `'StatusBar'`. Use this if you need to add multiple StatusBar instances.

### `target: body`

DOM element, CSS selector, or plugin to mount the Status Bar into.

### `hideAfterFinish: true`

Hide the Status Bar after the upload is complete.

### `showProgressDetails: false`

By default, progress in the Status Bar is shown as simple percentage. If you would like to also display remaining upload size and time, set this to `true`.

`showProgressDetails: false`: Uploading: 45%
`showProgressDetails: true`: Uploading: 45%・43 MB of 101 MB・8s left

### `hideUploadButton: false`

Hide the upload button. Use this if you are providing a custom upload button somewhere, and using the `uppy.upload()` API.

### `hideRetryButton: false`

Hide the retry button. Use this if you are providing a custom retry button somewhere, and using the `uppy.retryAll()` or `uppy.retryUpload(fileID)` API.

### `hidePauseResumeButton: false`

Hide pause/resume buttons (for resumable uploads, via [tus](http://tus.io), for example). Use this if you are providing custom cancel or pause/resume buttons somewhere, and using the `uppy.pauseResume(fileID)` or `uppy.removeFile(fileID)` API.

### `hideCancelButton: false`

Hide the cancel button. Use this if you are providing a custom retry button somewhere, and using the `uppy.cancelAll()` API.

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

Remove all children of the `target` element before mounting the Status Bar. By default, Uppy will append any UI to the `target` DOM element. This is the least dangerous option. However, you may have some fallback HTML inside the `target` element in case JavaScript or Uppy is not available. In that case, you can set `replaceTargetContent: true` to clear the `target` before appending.

[`@uppy/file-input`]: /docs/file-input
[`@uppy/drag-drop`]: /docs/drag-drop
