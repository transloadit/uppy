---
type: docs
order: 6
title: "Dashboard"
permalink: docs/dashboard/
---

Dashboard is a universal UI plugin for Uppy:

- Drag and Drop, paste, select from local disk / my device
- UI for Webcam and remote sources: Google Drive, Dropbox, Instagram (all optional, added via plugins)
- File previews and info, metadata editor
- Progress: total and for individual files
- Ability to pause/resume or cancel (depending on uploader plugin) individual or all files

[Try it live](/examples/dashboard/)

## Options

```js
uppy.use(Dashboard, {
  target: 'body',
  getMetaFromForm: true,
  inline: false,
  width: 750,
  height: 550,
  note: false,
  disableStatusBar: false,
  disableInformer: false,
  locale: {
    strings: {
      selectToUpload: 'Select files to upload',
      closeModal: 'Close Modal',
      upload: 'Upload',
      importFrom: 'Import files from',
      dashboardWindowTitle: 'Uppy Dashboard Window (Press escape to close)',
      dashboardTitle: 'Uppy Dashboard',
      copyLinkToClipboardSuccess: 'Link copied to clipboard.',
      copyLinkToClipboardFallback: 'Copy the URL below',
      done: 'Done',
      localDisk: 'Local Disk',
      dropPasteImport: 'Drop files here, paste, import from one of the locations above or',
      dropPaste: 'Drop files here, paste or',
      browse: 'browse',
      fileProgress: 'File progress: upload speed and ETA',
      numberOfSelectedFiles: 'Number of selected files',
      uploadAllNewFiles: 'Upload all new files'
    }
  }
})
```

### `target: 'body'`

Dashboard is rendered into `body` by default, because by default it’s hidden and only opened as a modal when `trigger` is clicked.

### `inline: false`

By default Dashboard will be rendered as a modal, which is opened via clicking on `trigger`. If `inline: true`, Dashboard will be rendered into `target` and fit right in.

### `trigger: '#uppy-select-files'`

String with a CSS selector for a button that will trigger opening Dashboard modal.

### `width: 750`

Maximum width of the Dashboard in pixels. Used when `inline: true`.

### `height: 750`

Maximum height of the Dashboard in pixels. Used when `inline: true`.

### `note: false`

Optinally specify a string of text that explains something about the upload for the user. This is a place to explain `restrictions` that are put in place. For example: `'Images and video only, 2–3 files, up to 1 MB'`.

### `disableStatusBar: false`

Dashboard ships with `StatusBar` plugin that shows upload progress and pause/resume/cancel buttons. If you want, you can disable the StatusBar to provide your custom solution.

### `disableInformer: false`

Dashboard ships with `Informer` plugin that notifies when the browser is offline, or when it’s time to smile if `Webcam` is taking a picture. If you want, you can disable the Informer and/or provide your custom solution.

### `getMetaFromForm: true`

See [general plugin options](/docs/plugins).

### `locale`

See [general plugin options](/docs/plugins).