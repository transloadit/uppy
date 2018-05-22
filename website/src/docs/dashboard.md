---
type: docs
order: 20
title: "Dashboard"
permalink: docs/dashboard/
---

Dashboard is a universal UI plugin for Uppy:

- Drag and Drop, paste, select from local disk / my device
- UI for Webcam and remote sources: Google Drive, Dropbox, Instagram (all optional, added via plugins)
- File previews and info
- Metadata editor
- Progress: total and for individual files
- Ability to pause/resume or cancel (depending on uploader plugin) individual or all files

```js
const Dashboard = require('uppy/lib/plugins/Dashboard')

uppy.use(Dashboard, {
  // Options
})
```

[Try it live](/examples/dashboard/)

## Options

```js
uppy.use(Dashboard, {
  target: 'body',
  metaFields: [],
  trigger: '#uppy-select-files',
  inline: false,
  width: 750,
  height: 550,
  thumbnailWidth: 280,
  defaultTabIcon: defaultTabIcon,
  showLinkToFileUploadResult: true,
  showProgressDetails: false,
  hideUploadButton: false,
  hideProgressAfterFinish: false,
  note: null,
  closeModalOnClickOutside: false,
  disableStatusBar: false,
  disableInformer: false,
  disableThumbnailGenerator: false,
  disablePageScrollWhenModalOpen: true,
  proudlyDisplayPoweredByUppy: true,
  onRequestCloseModal: () => this.closeModal(),
  locale: {
    strings: {
      selectToUpload: 'Select files to upload',
      closeModal: 'Close Modal',
      upload: 'Upload',
      importFrom: 'Import from',
      dashboardWindowTitle: 'Uppy Dashboard Window (Press escape to close)',
      dashboardTitle: 'Uppy Dashboard',
      copyLinkToClipboardSuccess: 'Link copied to clipboard.',
      copyLinkToClipboardFallback: 'Copy the URL below',
      copyLink: 'Copy link',
      fileSource: 'File source',
      done: 'Done',
      name: 'Name',
      removeFile: 'Remove file',
      editFile: 'Edit file',
      editing: 'Editing',
      finishEditingFile: 'Finish editing file',
      localDisk: 'Local Disk',
      myDevice: 'My Device',
      dropPasteImport: 'Drop files here, paste, import from one of the locations above or',
      dropPaste: 'Drop files here, paste or',
      browse: 'browse',
      fileProgress: 'File progress: upload speed and ETA',
      numberOfSelectedFiles: 'Number of selected files',
      uploadAllNewFiles: 'Upload all new files',
      emptyFolderAdded: 'No files were added from empty folder',
      uploadComplete: 'Upload complete',
      resumeUpload: 'Resume upload',
      pauseUpload: 'Pause upload',
      retryUpload: 'Retry upload',
      uploadXFiles: {
        0: 'Upload %{smart_count} file',
        1: 'Upload %{smart_count} files'
      },
      uploadXNewFiles: {
        0: 'Upload +%{smart_count} file',
        1: 'Upload +%{smart_count} files'
      },
      folderAdded: {
        0: 'Added %{smart_count} file from %{folder}',
        1: 'Added %{smart_count} files from %{folder}'
      }
    }
  }
})
```

### `id: 'Dashboard'`

A unique identifier for this Dashboard. Defaults to `'Dashboard'`. Change this if you need multiple Dashboard instances.
Plugins that are added by the Dashboard get unique IDs based on this ID, like `'Dashboard:StatusBar'` and `'Dashboard:Informer'`.

### `target: 'body'`

Dashboard is rendered into `body` by default, because by default it’s hidden and only opened as a modal when `trigger` is clicked.

### `inline: false`

By default Dashboard will be rendered as a modal, which is opened via clicking on `trigger`. If `inline: true`, Dashboard will be rendered into `target` and fit right in.

### `trigger: '#uppy-select-files'`

String with a CSS selector for a button that will trigger opening Dashboard modal. Multiple buttons or links can be used, if it’s a class selector (`.uppy-choose`, for example).

### `plugins: []`

List of plugin IDs that should be shown in the Dashboard's top bar. For example, to show the Webcam plugin:

```js
uppy.use(Webcam)
uppy.use(Dashboard, {
  plugins: ['Webcam']
})
```

Of course, you can also use the `target` option in the Webcam plugin to achieve this. However, that does not work with the React components. The `target` option may be changed in the future to only accept DOM elements, so it is recommended to use this `plugins` array instead.

### `width: 750`

Width of the Dashboard in pixels. Used when `inline: true`.

### `height: 550`

Height of the Dashboard in pixels. Used when `inline: true`.

### `showProgressDetails: false`

By default, progress in StatusBar is shown as simple percentage. If you’d like to also display remaining upload size and time, set this to `true`.

`showProgressDetails: false`: Uploading: 45%
`showProgressDetails: true`: Uploading: 45%・43 MB of 101 MB・8s left

### `hideUploadButton: false`

Hide the upload button. Use this if you are providing a custom upload button somewhere on the page using the `uppy.upload()` API.

### `hideProgressAfterFinish: false`

Hide StatusBar after upload finish

### `note: null`

Optionally specify a string of text that explains something about the upload for the user. This is a place to explain `restrictions` that are put in place. For example: `'Images and video only, 2–3 files, up to 1 MB'`.

### `metaFields: []`

An array of UI field objects that will be shown when a user clicks the “edit” button on that file. Configuring this enables the "edit" button on file cards. Each object requires:

- `id`, the name of the meta field.
- `name`, the label shown in the interface.
- `placeholder`, the text shown when no value it set in the field.

```js
.use(Dashboard, {
  trigger: '#pick-files',
  metaFields: [
    { id: 'name', name: 'Name', placeholder: 'file name' },
    { id: 'license', name: 'License', placeholder: 'specify license' },
    { id: 'caption', name: 'Caption', placeholder: 'describe what the image is about' }
  ]
})
```

Note that this metadata will only be set on a file object if it’s entered by the user. If the user doesn't edit a file's metadata, it will not have default values; instead everything will be `undefined`. If you want to set certain meta field to each file regardless of user actions, set [`meta` in the Uppy constructor options](/docs/uppy/#meta).

### `closeModalOnClickOutside: false`

Set to true to automatically close the modal when the user clicks outside of it.

### `disablePageScrollWhenModalOpen: true`

By default when Dashboard modal is open, it will disable page scrolling, so when you scroll a list of files in Uppy the website in the background stays still. Set to false to override this behaviour and leave page scrolling intact.

### `proudlyDisplayPoweredByUppy: true`

Uppy is provided for the world for free by the [Transloadit team](https://transloadit.com). In return, we ask that you consider keeping a tiny Uppy logo at the bottom of the Dashboard, so that more people can discover and use Uppy.

This is entirely optional of course, just set this option to false if you do not wish to display Uppy logo.

### `disableStatusBar: false`

Dashboard ships with the `StatusBar` plugin that shows upload progress and pause/resume/cancel buttons. If you want, you can disable the StatusBar to provide your custom solution.

### `disableInformer: false`

Dashboard ships with the `Informer` plugin that notifies when the browser is offline, or when it’s time to smile if `Webcam` is taking a picture. If you want, you can disable the Informer and/or provide your custom solution.

### `disableThumbnailGenerator: false`

Dashboard ships with `ThumbnailGenerator` plugin that adds small resized image thumbnails to images, for preview purposes only. If you want, you can disable the `ThumbnailGenerator` and/or provide your custom solution.

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
