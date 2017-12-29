---
type: docs
order: 20
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
  trigger: '#uppy-select-files',
  inline: false,
  maxWidth: 750,
  maxHeight: 550,
  semiTransparent: false,
  showProgressDetails: false,
  hideUploadButton: false,
  note: null,
  metaFields: [],
  closeModalOnClickOutside: false,
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
      fileSource: 'File source',
      done: 'Done',
      localDisk: 'Local Disk',
      myDevice: 'My Device',
      dropPasteImport: 'Drop files here, paste, import from one of the locations above or',
      dropPaste: 'Drop files here, paste or',
      browse: 'browse',
      fileProgress: 'File progress: upload speed and ETA',
      numberOfSelectedFiles: 'Number of selected files',
      uploadAllNewFiles: 'Upload all new files',
      emptyFolderAdded: 'No files were added from empty folder',
      folderAdded: {
        0: 'Added %{smart_count} file from %{folder}',
        1: 'Added %{smart_count} files from %{folder}'
      }
    }
  }
})
```

### `target: 'body'`

Dashboard is rendered into `body` by default, because by default it’s hidden and only opened as a modal when `trigger` is clicked.

### `inline: false`

By default Dashboard will be rendered as a modal, which is opened via clicking on `trigger`. If `inline: true`, Dashboard will be rendered into `target` and fit right in.

### `trigger: '#uppy-select-files'`

String with a CSS selector for a button that will trigger opening Dashboard modal. Multiple buttons or links can be used, if it’s a class selector (`.uppy-choose`, for example).

### `maxWidth: 750`

Maximum width of the Dashboard in pixels. Used when `inline: true`.

### `maxHeight: 550`

Maximum height of the Dashboard in pixels. Used when `inline: true`.

### `semiTransparent: false`

Make the dashboard semi-transparent.

### `showProgressDetails: false`

Show progress bars for the uploads.

### `hideUploadButton: false`

Hide the upload button. Use this if you are providing a custom upload button somewhere on the page using the `uppy.upload()` API.

### `note: null`

Optionally specify a string of text that explains something about the upload for the user. This is a place to explain `restrictions` that are put in place. For example: `'Images and video only, 2–3 files, up to 1 MB'`.

### `metaFields: []`

An array of UI field objects that will be shown when a user clicks “edit” button on that file. Each object requires:

- `id`, the name of the meta field.
- `name`, the label shown in the interface.
- `placeholder`, the text shown when no value it set in the field.

```js
.use(Dashboard, {
  trigger: '#pick-files',
  metaFields: [
    { id: 'license', name: 'License', placeholder: 'specify license' },
    { id: 'caption', name: 'Caption', placeholder: 'describe what the image is about' }
  ]
})
```

Note that this meta data will only be set to a file if it’s entered by user. If you want to set certain default meta field to each file regardless of user actions, set [`meta` in Uppy options](docs/uppy/#meta).

### `closeModalOnClickOutside: false`

Set to true to automatically close the modal when the user clicks outside it.

### `disableStatusBar: false`

Dashboard ships with `StatusBar` plugin that shows upload progress and pause/resume/cancel buttons. If you want, you can disable the StatusBar to provide your custom solution.

### `disableInformer: false`

Dashboard ships with `Informer` plugin that notifies when the browser is offline, or when it’s time to smile if `Webcam` is taking a picture. If you want, you can disable the Informer and/or provide your custom solution.

### `locale`

See [general plugin options](/docs/plugins).

## Methods

### `openModal()`

Shows the Dashboard modal. Use it like this:

`uppy.getPlugin('Dashboard').openModal()`

### `closeModal()`

Hides the Dashboard modal. Use it like this:

`uppy.getPlugin('Dashboard').closeModal()`

### `isModalOpen()`

Returns `true` if the Dashboard modal is open, `false` otherwise.

```js
const dashboard = uppy.getPlugin('Dashboard')
if ( dashboard.isModalOpen() ) {
  dashboard.closeModal()
}
```
