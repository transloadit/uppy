---
type: docs
order: 0
title: "Dashboard"
module: "@uppy/dashboard"
permalink: docs/dashboard/
category: 'UI Elements'
tagline: full-featured sleek UI with file previews, metadata editing, upload/pause/resume/cancel buttons and more. Includes <code>StatusBar</code> and <code>Informer</code> plugins by default
---

`@uppy/dashboard` is a universal UI plugin for Uppy, offering several useful features:

- Drag and drop, paste, select from local disk / my device
- UI for the Webcam plugin and remote sources, such as Google Drive, Dropbox, Instagram (all optional, added via plugins)
- File previews and info
- Metadata editor
- Progress: total and for individual files
- Ability to pause/resume or cancel (depending on uploader plugin) individual or all files

```js
const Dashboard = require('@uppy/dashboard')

uppy.use(Dashboard, {
  // Options
})
```

<a class="TryButton" href="/examples/dashboard/">Try it live</a>

## Installation

This plugin is published as the `@uppy/dashboard` package.

Install from NPM:

```shell
npm install @uppy/dashboard
```

In the [CDN package](/docs/#With-a-script-tag), it is available on the `Uppy` global object:

```js
const Dashboard = Uppy.Dashboard
```

## CSS

The `@uppy/dashboard` plugin requires the following CSS for styling:

```js
import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the Dashboard styles from `@uppy/dashboard/dist/style.css`. A minified version is also available as `style.min.css` at the same path. The way to do import depends on your build system.

⚠️ The `@uppy/dashboard` plugin includes CSS for the Dashboard itself, and the various plugins used by the Dashboard, such as ([`@uppy/status-bar`](/docs/status-bar) and [`@uppy/informer`](/docs/informer)). If you also use the `@uppy/status-bar` or `@uppy/informer` plugin directly, you should not include their CSS files, but instead only use the one from the `@uppy/dashboard` plugin.

Styles for Provider plugins, like Google Drive and Instagram, are also bundled with Dashboard styles. Styles for other plugins, such as `@uppy/url` and `@uppy/webcam`, are not inluded. If you are using those, please see their docs and make sure to include styles for them as well.

## Options

The Dashboard can be extensively customized by configuring the options below to your liking:

```js
uppy.use(Dashboard, {
  id: 'Dashboard',
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
  hideRetryButton: false,
  hidePauseResumeButton: false,
  hideCancelButton: false,
  hideProgressAfterFinish: false,
  note: null,
  closeModalOnClickOutside: false,
  closeAfterFinish: false,
  disableStatusBar: false,
  disableInformer: false,
  disableThumbnailGenerator: false,
  disablePageScrollWhenModalOpen: true,
  animateOpenClose: true,
  proudlyDisplayPoweredByUppy: true,
  onRequestCloseModal: () => this.closeModal(),
  showSelectedFiles: true,
  locale: defaultLocale,
  browserBackButtonClose: false
})
```

### `id: 'Dashboard'`

A unique identifier for this plugin. It defaults to `'Dashboard'`, but you can change this if you need multiple Dashboard instances.
Plugins that are added by the Dashboard get unique IDs based on this ID, like `'Dashboard:StatusBar'` and `'Dashboard:Informer'`.

### `target: 'body'`

Dashboard is rendered into `body`, because it is hidden by default and only opened as a modal when `trigger` is clicked.

### `inline: false`

By default, Dashboard will be rendered as a modal, which is opened by clicking on `trigger`. If `inline: true`, Dashboard will be rendered into `target` and fit right in.

### `trigger: '#uppy-select-files'`

String with a CSS selector for a button that will trigger opening the Dashboard modal. Multiple buttons or links can be used, as long as it is a class selector (`.uppy-choose`, for example).

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

### `showLinkToFileUploadResult: true`

By default, when a file upload has completed, the file icon in the Dashboard turns into a link to the uploaded file. If your app does not publicly store uploaded files or if it's otherwise unwanted, pass `showLinkToFileUploadResult: false`.

### `showProgressDetails: false`

Passed to the Status Bar plugin used in the Dashboard.

By default, progress in Status Bar is shown as a simple percentage. If you would like to also display remaining upload size and time, set this to `true`.

`showProgressDetails: false`: Uploading: 45%
`showProgressDetails: true`: Uploading: 45%・43 MB of 101 MB・8s left

### `hideUploadButton: false`

Passed to the Status Bar plugin used in the Dashboard.

Hide the upload button. Use this if you are providing a custom upload button somewhere, and using the `uppy.upload()` API.

### `hideRetryButton: false`

Passed to the Status Bar plugin used in the Dashboard.

Hide the retry button. Use this if you are providing a custom retry button somewhere, and using the `uppy.retryAll()` or `uppy.retryUpload(fileID)` API.

### `hidePauseResumeButton: false`

Passed to the Status Bar plugin used in the Dashboard.

Hide pause/resume buttons (for resumable uploads, via [tus](http://tus.io), for example). Use this if you are providing custom cancel or pause/resume buttons somewhere, and using the `uppy.pauseResume(fileID)` or `uppy.removeFile(fileID)` API.

### `hideCancelButton: false`

Passed to the Status Bar plugin used in the Dashboard.

Hide the cancel button. Use this if you are providing a custom retry button somewhere, and using the `uppy.cancelAll()` API.

### `hideProgressAfterFinish: false`

Hide Status Bar after the upload has finished.

### `showSelectedFiles: true`

Show the list (grid) of selected files with preview and file name. In case you are showing selected files in your own app’s UI and want the Uppy Dashboard to just be a picker, the list can be hidden with this option.

See also `disableStatusBar` option, which can hide the progress and upload button.

### `note: null`

Optionally, specify a string of text that explains something about the upload for the user. This is a place to explain any `restrictions` that are put in place. For example: `'Images and video only, 2–3 files, up to 1 MB'`.

### `metaFields: []`

An array of UI field objects that will be shown when a user clicks the “edit” button on that file. Configuring this enables the "edit" button on file cards. Each object requires:

- `id`, the name of the meta field. Note: this will also be used in CSS/HTML as part of the `id` attribute, so it’s better to [avoid using characters like periods, semicolons, etc](https://stackoverflow.com/a/79022).
- `name`, the label shown in the interface.
- `placeholder`, the text shown when no value is set in the field.

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

![](/images/uppy-dashboard-meta-fields.jpg)

Note that this metadata will only be set on a file object if it is entered by the user. If the user doesn't edit a file's metadata, it will not have default values; instead everything will be `undefined`. If you want to set a certain meta field to each file regardless of user actions, set [`meta` in the Uppy constructor options](/docs/uppy/#meta).

### `closeModalOnClickOutside: false`

Set to true to automatically close the modal when the user clicks outside of it.

### `closeAfterFinish: false`

Set to true to automatically close the modal when all current uploads are complete. You can use this together with the [`allowMultipleUploads: false`](/docs/uppy#allowMultipleUploads-true) option in Uppy Core to create a smooth experience when uploading a single (batch of) file(s).

With this option, the modal is only automatically closed when uploads are complete _and successful_. If some uploads failed, the modal stays open so the user can retry failed uploads or cancel the current batch and upload an entirely different set of files instead.

> Setting [`allowMultipleUploads: false`](/docs/uppy#allowMultipleUploads-true) is **strongly** recommended when using this option. With multiple upload batches, the auto-closing behavior can be very confusing for users.

### `disablePageScrollWhenModalOpen: true`

Page scrolling is disabled by default when the Dashboard modal is open, so when you scroll a list of files in Uppy, the website in the background stays still. Set to false to override this behaviour and leave page scrolling intact.

### `animateOpenClose: true`

Add light animations when the modal dialog is opened or closed, for a more satisfying user experience.

### `proudlyDisplayPoweredByUppy: true`

Uppy is provided to the world for free by the team behind [Transloadit](https://transloadit.com). In return, we ask that you consider keeping a tiny Uppy logo at the bottom of the Dashboard, so that more people can discover and use Uppy.

This is, of course, entirely optional. Just set this option to false if you do not wish to display the Uppy logo.

### `disableStatusBar: false`

Dashboard ships with the `StatusBar` plugin that shows upload progress and pause/resume/cancel buttons. If you want, you can disable the StatusBar to provide your own custom solution.

### `disableInformer: false`

Dashboard ships with the `Informer` plugin that notifies when the browser is offline, or when it is time to say cheese if `Webcam` is taking a picture. If you want, you can disable the Informer and/or provide your own custom solution.

### `disableThumbnailGenerator: false`

Dashboard ships with the `ThumbnailGenerator` plugin that adds small resized image thumbnails to images, for preview purposes only. If you want, you can disable the `ThumbnailGenerator` and/or provide your own custom solution.

### `locale: {}`

Localize text that is shown to the user.

The Dashboard also contains the [`@uppy/status-bar`](/docs/status-bar) plugin by default, which has its own strings. Strings for the Status Bar can also be specified in the Dashboard `locale.strings` option, and will be passed down. They are not all listed below—see the [`@uppy/status-bar`](/docs/status-bar) documentation pages for the full list.

The default English strings are:

```js
strings: {
  // When `inline: false`, used as the screen reader label for the button that closes the modal.
  closeModal: 'Close Modal',
  // Used as the screen reader label for the plus (+) button that shows the “Add more files” screen
  addMoreFiles: 'Add more files',
  // Used as the header for import panels, e.g., "Import from Google Drive".
  importFrom: 'Import from %{name}',
  // When `inline: false`, used as the screen reader label for the dashboard modal.
  dashboardWindowTitle: 'Uppy Dashboard Window (Press escape to close)',
  // When `inline: true`, used as the screen reader label for the dashboard area.
  dashboardTitle: 'Uppy Dashboard',
  // Shown in the Informer when a link to a file was copied to the clipboard.
  copyLinkToClipboardSuccess: 'Link copied to clipboard.',
  // Used when a link cannot be copied automatically — the user has to select the text from the
  // input element below this string.
  copyLinkToClipboardFallback: 'Copy the URL below',
  // Used as the hover title and screen reader label for buttons that copy a file link.
  copyLink: 'Copy link',
  // Used as the hover title and screen reader label for file source icons, e.g., "File source: Dropbox".
  fileSource: 'File source: %{name}',
  // Used as the label for buttons that accept and close panels (remote providers or metadata editor)
  done: 'Done',
  // Used as the screen reader label for buttons that remove a file.
  removeFile: 'Remove file',
  // Used as the screen reader label for buttons that open the metadata editor panel for a file.
  editFile: 'Edit file',
  // Shown in the panel header for the metadata editor. Rendered as "Editing image.png".
  editing: 'Editing %{file}',
  // Text for a button shown on the file preview, used to edit file metadata
  edit: 'Edit',
  // Used as the screen reader label for the button that saves metadata edits and returns to the
  // file list view.
  finishEditingFile: 'Finish editing file',
  // Used as the label for the tab button that opens the system file selection dialog.
  myDevice: 'My Device',
  // Shown in the main dashboard area when no files have been selected, and one or more
  // remote provider plugins are in use. %{browse} is replaced with a link that opens the system
  // file selection dialog.
  dropPasteImport: 'Drop files here, paste, %{browse} or import from',
  // Shown in the main dashboard area when no files have been selected, and no provider
  // plugins are in use. %{browse} is replaced with a link that opens the system
  // file selection dialog.
  dropPaste: 'Drop files here, paste or %{browse}',
  // This string is clickable and opens the system file selection dialog.
  browse: 'browse',
  // Used as the hover text and screen reader label for file progress indicators when
  // they have been fully uploaded.
  uploadComplete: 'Upload complete',
  // Used as the hover text and screen reader label for the buttons to resume paused uploads.
  resumeUpload: 'Resume upload',
  // Used as the hover text and screen reader label for the buttons to pause uploads.
  pauseUpload: 'Pause upload',
  // Used as the hover text and screen reader label for the buttons to retry failed uploads.
  retryUpload: 'Retry upload',

  // Used in a title, how many files are currently selected
  xFilesSelected: {
    0: '%{smart_count} file selected',
    1: '%{smart_count} files selected'
  },

  // @uppy/status-bar strings:
  uploading: 'Uploading',
  complete: 'Complete'
  // ...etc
}
```

### `replaceTargetContent: false`

Remove all children of the `target` element before mounting the Dashboard. By default, Uppy will append any UI to the `target` DOM element. This is the least dangerous option. However, there might be cases when you would want to clear the container element before placing Uppy UI in there (for example, to provide a fallback `<form>` that will be shown if Uppy or JavaScript is not available). Set `replaceTargetContent: true` to clear the `target` before appending.

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

## Events

### `dashboard:modal-open`

Fired when the Dashboard modal is open.

```js
uppy.on('dashboard:modal-open', () => {
  console.log('Modal is open')
})
```

### `dashboard:modal-closed`

Fired when the Dashboard modal is closed.
