---
type: docs
order: 0
title: "Status Bar"
module: "@uppy/status-bar"
permalink: docs/status-bar/
alias: docs/statusbar/
category: "UI Elements"
tagline: "advanced upload progress status bar"
---

The `@uppy/status-bar` plugin shows upload progress and speed, ETAs, pre- and post-processing information, and allows users to control (pause/resume/cancel) the upload.
This plugin is best used in combination with a basic file source plugin, such as \[`@uppy/file-input`]\[@uppy/file-input] or \[`@uppy/drag-drop`]\[@uppy/drag-drop], or a custom implementation.

```js
import StatusBar from '@uppy/status-bar'

uppy.use(StatusBar, {
  // Options
})
```

<a class="TryButton" href="/examples/statusbar/">Try it live</a>

The StatusBar plugin is included in the Dashboard by default.

## Installation

This plugin is published as the `@uppy/status-bar` package.

Install from NPM:

```shell
npm install @uppy/status-bar
```

In the [CDN package](/docs/#With-a-script-tag), the plugin class is available on the `Uppy` global object:

```js
const { StatusBar } = Uppy
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
  hideCancelButton: false,
  doneButtonHandler: null,
  locale: {},
})
```

### `id: 'StatusBar'`

A unique identifier for this Status Bar. It defaults to `'StatusBar'`. Use this if you need to add several StatusBar instances.

### `target: body`

DOM element, CSS selector, or plugin to mount the Status Bar into.

### `hideAfterFinish: true`

Hide the Status Bar after the upload is complete.

### `showProgressDetails: false`

By default, progress in the Status Bar is shown as percentage only. If you would like to also display remaining upload size and time, set this to `true`.

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

### `doneButtonHandler`

If passed a function, Status Bar will render a “Done” button in place of pause/resume/cancel buttons, once the upload/encoding is done. The behaviour of this “Done” button is defined by the handler function — can be used to close file picker modals or clear the upload state. This is what the Dashboard plugin, which uses Status Bar internally, sets:

```js
const doneButtonHandler = () => {
  this.uppy.reset()
  this.requestCloseModal()
}
```

### `locale: {}`

```json
{
  "strings": {
    "uploading": "Uploading",
    "upload": "Upload",
    "complete": "Complete",
    "uploadFailed": "Upload failed",
    "paused": "Paused",
    "retry": "Retry",
    "retryUpload": "Retry upload",
    "cancel": "Cancel",
    "pause": "Pause",
    "resume": "Resume",
    "done": "Done",
    "filesUploadedOfTotal": {
      "0": "%{complete} of %{smart_count} file uploaded",
      "1": "%{complete} of %{smart_count} files uploaded"
    },
    "dataUploadedOfTotal": "%{complete} of %{total}",
    "xTimeLeft": "%{time} left",
    "uploadXFiles": {
      "0": "Upload %{smart_count} file",
      "1": "Upload %{smart_count} files"
    },
    "uploadXNewFiles": {
      "0": "Upload +%{smart_count} file",
      "1": "Upload +%{smart_count} files"
    },
    "xMoreFilesAdded": {
      "0": "%{smart_count} more file added",
      "1": "%{smart_count} more files added"
    }
  }
}
```
