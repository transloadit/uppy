---
type: docs
order: 0
title: "Dashboard"
module: "@uppy/dashboard"
permalink: docs/dashboard/
category: "UI Elements"
tagline: "full-featured sleek UI with file previews, metadata editing, upload/pause/resume/cancel buttons and more. Includes <code>StatusBar</code> and <code>Informer</code> plugins by default"
---

`@uppy/dashboard` is a universal UI plugin for Uppy, offering several useful features:

* Drag and drop, paste, select from local disk / my device
* UI for the Webcam plugin and remote sources, such as Google Drive, Dropbox, Instagram, Facebook and OneDrive (all optional, added via plugins)
* Image previews
* Metadata editor
* Upload progress
* Ability to pause or cancel (depending on the uploader plugin) uploads

```js
import Dashboard from '@uppy/dashboard'

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

In the [CDN package](/docs/#With-a-script-tag), the plugin class is available on the `Uppy` global object:

```js
const { Dashboard } = Uppy
```

## CSS

The `@uppy/dashboard` plugin requires the following CSS for styling:

```js
import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the Dashboard styles from `@uppy/dashboard/dist/style.css`. A minified version is also available as `style.min.css` at the same path. The way to do import depends on your build system.

⚠️ The `@uppy/dashboard` plugin includes CSS for the Dashboard itself, and the various plugins used by the Dashboard, such as ([`@uppy/status-bar`](/docs/status-bar) and [`@uppy/informer`](/docs/informer)). If you also use the `@uppy/status-bar` or `@uppy/informer` plugin directly, you should not include their CSS files, but instead only use the one from the `@uppy/dashboard` plugin.

Styles for Provider plugins, like Google Drive and Instagram, are also bundled with Dashboard styles. Styles for other plugins, such as `@uppy/url` and `@uppy/webcam`, are not included. If you are using those, please see their docs and make sure to include styles for them as well.

## Options

The Dashboard can be extensively customized by configuring the options below to your liking:

```js
uppy.use(Dashboard, {
  id: 'Dashboard',
  target: 'body',
  metaFields: [],
  trigger: null,
  inline: false,
  width: 750,
  height: 550,
  thumbnailWidth: 280,
  defaultTabIcon,
  showLinkToFileUploadResult: false,
  showProgressDetails: false,
  hideUploadButton: false,
  hideRetryButton: false,
  hidePauseResumeButton: false,
  hideCancelButton: false,
  hideProgressAfterFinish: false,
  doneButtonHandler: () => {
    this.uppy.reset()
    this.requestCloseModal()
  },
  note: null,
  closeModalOnClickOutside: false,
  closeAfterFinish: false,
  disableStatusBar: false,
  disableInformer: false,
  disableThumbnailGenerator: false,
  disablePageScrollWhenModalOpen: true,
  animateOpenClose: true,
  fileManagerSelectionType: 'files',
  proudlyDisplayPoweredByUppy: true,
  onRequestCloseModal: () => this.closeModal(),
  showSelectedFiles: true,
  showRemoveButtonAfterComplete: false,
  locale: defaultLocale,
  browserBackButtonClose: false,
  theme: 'light',
  autoOpenFileEditor: false,
  disableLocalFiles: false,
})
```

### `id: 'Dashboard'`

A unique identifier for this plugin. It defaults to `'Dashboard'`, but you can change this if you need several Dashboard instances.
Plugins that are added by the Dashboard get unique IDs based on this ID, like `'Dashboard:StatusBar'` and `'Dashboard:Informer'`.

### `target: 'body'`

Dashboard is rendered into `body`, because it’s hidden by default and only opened as a modal when `trigger` is clicked.

### `inline: false`

By default, Dashboard will be rendered as a modal, which is opened by clicking on `trigger`. If `inline: true`, Dashboard will be rendered into `target` and fit right in.

### `trigger: null`

String with a CSS selector for a button that will trigger opening the Dashboard modal. Several buttons or links can be used, as long as they are selected using a class selector (`.select-file-button`, for example).

### `plugins: []`

List of plugin IDs that should be shown in the Dashboard’s top bar. For example, to show the Webcam plugin:

```js
uppy.use(Webcam)
uppy.use(Dashboard, {
  plugins: ['Webcam'],
})
```

You could also use the `target` option in the Webcam plugin to achieve this, but that does not work with the React components. The `target` option may be changed in the future to only accept DOM elements, so it’s recommended to use this `plugins` array instead.

### `width: 750`

Width of the Dashboard in pixels. Used when `inline: true`.

### `height: 550`

Height of the Dashboard in pixels. Used when `inline: true`.

### `waitForThumbnailsBeforeUpload: false`

Whether to wait for all thumbnails from `@uppy/thumbnail-generator` to be ready before starting the upload. If set to `true`, Thumbnail Generator will envoke Uppy’s internal processing stage, displaying “Generating thumbnails...” message, and wait for `thumbnail:all-generated` event, before proceeding to the uploading stage.

This is useful because Thumbnail Generator also adds EXIF data to images, and if we wait until it’s done processing, this data will be avilable on the server after the upload.

### `showLinkToFileUploadResult: false`

Turn the file icon and thumbnail in the Dashboard into a link to the uploaded file. Please make sure to return the `url` key (or the one set via `responseUrlFieldName`) from your server.

### `showProgressDetails: false`

Passed to the Status Bar plugin used in the Dashboard.

By default, progress in Status Bar is shown as a percentage. If you would like to also display remaining upload size and time, set this to `true`.

`showProgressDetails: false`: Uploading: 45%
`showProgressDetails: true`: Uploading: 45%・43 MB of 101 MB・8s left

### `hideUploadButton: false`

Passed to the Status Bar plugin used in the Dashboard.

Hide the upload button. Use this if you are providing a custom upload button somewhere, and using the `uppy.upload()` API.

### `hideRetryButton: false`

Hide the retry button in StatusBar (the progress bar below the file list) and on each individual file.

Use this if you are providing a custom retry button somewhere, and using the `uppy.retryAll()` or `uppy.retryUpload(fileID)` API.

### `hidePauseResumeButton: false`

Hide the pause/resume button (for resumable uploads, via [tus](http://tus.io), for example) in StatusBar and on each individual file.

Use this if you are providing custom cancel or pause/resume buttons somewhere, and using the `uppy.pauseResume(fileID)` or `uppy.removeFile(fileID)` API.

### `hideCancelButton: false`

Hide the cancel button in StatusBar and on each individual file.

Use this if you are providing a custom retry button somewhere, and using the `uppy.cancelAll()` API.

### `hideProgressAfterFinish: false`

Hide Status Bar after the upload has finished.

### `doneButtonHandler`

This option is passed to the StatusBar, and will render a “Done” button in place of pause/resume/cancel buttons, once the upload/encoding is done. The behaviour of this “Done” button is defined by the handler function — can be used to close file picker modals or clear the upload state. This is what the Dashboard sets by default:

```js
const doneButtonHandler = () => {
  this.uppy.reset()
  this.requestCloseModal()
}
```

Set to `null` to disable the “Done” button.

### `showSelectedFiles: true`

Show the list (grid) of selected files with preview and file name. In case you are showing selected files in your own app’s UI and want the Uppy Dashboard to only be a picker, the list can be hidden with this option.

See also `disableStatusBar` option, which can hide the progress and upload button.

### `showRemoveButtonAfterComplete: false`

Sometimes you might want to let users remove an uploaded file. Enabling this option only shows the remove `X` button in the Dashboard UI, but to actually send a request you should listen to [`file-removed`](https://uppy.io/docs/uppy/#file-removed) event and add your logic there.

```js
uppy.on('file-removed', (file, reason) => {
  if (reason === 'removed-by-user') {
    sendDeleteRequestForFile(file)
  }
})
```

For an implementation example, please see [#2301](https://github.com/transloadit/uppy/issues/2301#issue-628931176)).

### `note: null`

Optionally, specify a string of text that explains something about the upload for the user. This is a place to explain any `restrictions` that are put in place. For example: `'Images and video only, 2–3 files, up to 1 MB'`.

### `metaFields: []`

An array of UI field objects, or a function that takes a [File Object](https://uppy.io/docs/uppy/#File-Objects) and returns an array of UI field objects, that will be shown when a user clicks the “edit” button on that file. Configuring this enables the “edit” button on file cards. Each object requires:

* `id`, the name of the meta field. Note: this will also be used in CSS/HTML as part of the `id` attribute, so it’s better to [avoid using characters like periods, semicolons, etc](https://stackoverflow.com/a/79022).
* `name`, the label shown in the interface.
* `placeholder`, the text shown when no value is set in the field. (Not needed when a custom render function is provided)

Optionally, you can specify `render: ({value, onChange, required, form}, h) => void`, a function for rendering a custom form element.
It gets passed `({value, onChange, required, form}, h)` where `value` is the current value of the meta field, `required` is a boolean that’s true if the field `id` is in the `restrictedMetaFields` restriction, `form` is the `id` of the associated `<form>` element, and `onChange: (newVal) => void` is a function saving the new value and `h` is the `createElement` function from [preact](https://preactjs.com/guide/v10/api-reference#h--createelement).
`h` can be useful when using uppy from plain JavaScript, where you cannot write JSX.

```js
uppy.use(Dashboard, {
  trigger: '#pick-files',
  metaFields: [
    { id: 'name', name: 'Name', placeholder: 'file name' },
    { id: 'license', name: 'License', placeholder: 'specify license' },
    { id: 'caption', name: 'Caption', placeholder: 'describe what the image is about' },
    {
      id: 'public',
      name: 'Public',
      render ({ value, onChange, required, form }, h) {
        return h('input', { type: 'checkbox', required, form, onChange: (ev) => onChange(ev.target.checked ? 'on' : ''), defaultChecked: value === 'on' })
      },
    },
  ],
})
```

If you’d like the meta fields to be dynamically assigned depending on, for instance, the file type, pass a function:

```js
uppy.use(Dashboard, {
  trigger: '#pick-files',
  metaFields: (file) => {
    const fields = [{ id: 'name', name: 'File name' }]
    if (file.type.startsWith('image/')) {
      fields.push({ id: 'location', name: 'Photo Location' })
      fields.push({ id: 'alt', name: 'Alt text' })
      fields.push({
        id: 'public',
        name: 'Public',
        render: ({ value, onChange, required, form }, h) => {
          return h('input', {
            type: 'checkbox',
            onChange: (ev) => onChange(ev.target.checked ? 'on' : ''),
            defaultChecked: value === 'on',
            required,
            form,
          })
        },
      })
    }
    return fields
  },
})
```

![](/images/uppy-dashboard-meta-fields.jpg)

Note that this metadata will only be set on a file object if it’s entered by the user. If the user doesn’t edit a file’s metadata, it will not have default values; instead everything will be `undefined`. If you want to set a certain meta field to each file regardless of user actions, set [`meta` in the Uppy constructor options](/docs/uppy/#meta).

### `closeModalOnClickOutside: false`

Set to true to automatically close the modal when the user clicks outside of it.

### `closeAfterFinish: false`

Set to true to automatically close the modal when all current uploads are complete. You can use this together with the [`allowMultipleUploads: false`](/docs/uppy#allowMultipleUploads-true) option in Uppy Core to create a smooth experience when uploading a single (batch of) file(s).

With this option, the modal is only automatically closed when uploads are complete _and successful_. If some uploads failed, the modal stays open so the user can retry failed uploads or cancel the current batch and upload an entirely different set of files instead.

> Setting [`allowMultipleUploads: false`](/docs/uppy#allowMultipleUploads-true) is **strongly** recommended when using this option. With several upload batches, the auto-closing behavior can be quite confusing for users.

### `disablePageScrollWhenModalOpen: true`

Page scrolling is disabled by default when the Dashboard modal is open, so when you scroll a list of files in Uppy, the website in the background stays still. Set to false to override this behaviour and leave page scrolling intact.

### `animateOpenClose: true`

Add light animations when the modal dialog is opened or closed, for a more satisfying user experience.

### `fileManagerSelectionType: 'files'`

Configure the type of selections allowed when browsing your file system via the file manager selection window. May be either `'files'`, `'folders'`, or `'both'`. Selecting entire folders for upload may not be supported on all [browsers](https://caniuse.com/#feat=input-file-directory).

### `proudlyDisplayPoweredByUppy: true`

Uppy is provided to the world for free by the team behind [Transloadit](https://transloadit.com). In return, we ask that you consider keeping a tiny Uppy logo at the bottom of the Dashboard, so that more people can discover and use Uppy.

Set this option to `false` if you do not wish to display the Uppy logo.

### `disableStatusBar: false`

Dashboard ships with the `StatusBar` plugin that shows upload progress and pause/resume/cancel buttons. If you want, you can disable the StatusBar to provide your own custom solution.

### `disableInformer: false`

Dashboard ships with the `Informer` plugin that notifies when the browser is offline, or when it’s time to say cheese if `Webcam` is taking a picture. If you want, you can disable the Informer and/or provide your own custom solution.

### `disableThumbnailGenerator: false`

Dashboard ships with the `ThumbnailGenerator` plugin that adds small resized image thumbnails to images, for preview purposes only. If you want, you can disable the `ThumbnailGenerator` and/or provide your own custom solution.

### `locale: {}`

<!-- eslint-disable no-restricted-globals, no-multiple-empty-lines -->

```js
export default {
  strings: {
    // When `inline: false`, used as the screen reader label for the button that closes the modal.
    closeModal: 'Close Modal',
    // Used as the screen reader label for the plus (+) button that shows the “Add more files” screen
    addMoreFiles: 'Add more files',
    addingMoreFiles: 'Adding more files',
    // Used as the header for import panels, e.g., “Import from Google Drive”.
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
    back: 'Back',
    // Used as the screen reader label for buttons that remove a file.
    removeFile: 'Remove file',
    // Used as the screen reader label for buttons that open the metadata editor panel for a file.
    editFile: 'Edit file',
    // Shown in the panel header for the metadata editor. Rendered as “Editing image.png”.
    editing: 'Editing %{file}',
    // Used as the screen reader label for the button that saves metadata edits and returns to the
    // file list view.
    finishEditingFile: 'Finish editing file',
    saveChanges: 'Save changes',
    // Used as the label for the tab button that opens the system file selection dialog.
    myDevice: 'My Device',
    dropHint: 'Drop your files here',
    // Used as the hover text and screen reader label for file progress indicators when
    // they have been fully uploaded.
    uploadComplete: 'Upload complete',
    uploadPaused: 'Upload paused',
    // Used as the hover text and screen reader label for the buttons to resume paused uploads.
    resumeUpload: 'Resume upload',
    // Used as the hover text and screen reader label for the buttons to pause uploads.
    pauseUpload: 'Pause upload',
    // Used as the hover text and screen reader label for the buttons to retry failed uploads.
    retryUpload: 'Retry upload',
    // Used as the hover text and screen reader label for the buttons to cancel uploads.
    cancelUpload: 'Cancel upload',
    // Used in a title, how many files are currently selected
    xFilesSelected: {
      0: '%{smart_count} file selected',
      1: '%{smart_count} files selected',
    },
    uploadingXFiles: {
      0: 'Uploading %{smart_count} file',
      1: 'Uploading %{smart_count} files',
    },
    processingXFiles: {
      0: 'Processing %{smart_count} file',
      1: 'Processing %{smart_count} files',
    },
    // The "powered by Uppy" link at the bottom of the Dashboard.
    poweredBy: 'Powered by %{uppy}',
    addMore: 'Add more',
    editFileWithFilename: 'Edit file %{file}',
    save: 'Save',
    cancel: 'Cancel',
    dropPasteFiles: 'Drop files here or %{browseFiles}',
    dropPasteFolders: 'Drop files here or %{browseFolders}',
    dropPasteBoth: 'Drop files here, %{browseFiles} or %{browseFolders}',
    dropPasteImportFiles: 'Drop files here, %{browseFiles} or import from:',
    dropPasteImportFolders: 'Drop files here, %{browseFolders} or import from:',
    dropPasteImportBoth:
      'Drop files here, %{browseFiles}, %{browseFolders} or import from:',
    importFiles: 'Import files from:',
    browseFiles: 'browse files',
    browseFolders: 'browse folders',
    recoveredXFiles: {
      0: 'We could not fully recover 1 file. Please re-select it and resume the upload.',
      1: 'We could not fully recover %{smart_count} files. Please re-select them and resume the upload.',
    },
    recoveredAllFiles: 'We restored all files. You can now resume the upload.',
    sessionRestored: 'Session restored',
    reSelect: 'Re-select',
    missingRequiredMetaFields: {
      0: 'Missing required meta field: %{fields}.',
      1: 'Missing required meta fields: %{fields}.',
    },
  },
}

```

### `theme: 'light'`

Uppy Dashboard supports “Dark Mode”. You can try it live on [the Dashboard example page](https://uppy.io/examples/dashboard/).

It supports the following values:

* `light` — the default
* `dark`
* `auto` — will respect the user’s system settings and switch automatically

![Uppy dark mode screenshot](/images/uppy-dashboard-dark-mar-2020.png)

### `autoOpenFileEditor: false`

Automatically open file editor (see [`@uppy/image-editor`](/docs/image-editor/)) for the first file in a batch. If one file is added, editor opens for that file, if 10 files are added — editor opens for the first file.

Use case: user adds an image — Uppy opens Image Editor right away — user crops / adjusts the image — upload.

### `disabled: false`

Enabling this option makes the Dashboard grayed-out and non-interactive. Users won’t be able to click on buttons or drop files.

Useful when you need to conditionally enable/disable file uploading or manipulation, based on a condition in your app. Can be set on init or via API:

```js
const dashboard = uppy.getPlugin('Dashboard')
dashboard.setOptions({ disabled: true })

userNameInput.addEventListener('change', () => {
  dashboard.setOptions({ disabled: false })
})
```

### `disableLocalFiles: false`

Enabling this option will disable drag & drop, hide the “browse” and “My Device” button, allowing only uploads from plugins, such as Webcam, Screen Capture, Google Drive, Instagram.

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
if (dashboard.isModalOpen()) {
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

### `dashboard:file-edit-start`

**Parameters:**

* `file` — The [File Object](https://uppy.io/docs/uppy/#File-Objects) representing the file that was opened for editing.

Fired when the user clicks “edit” icon next to a file in the Dashboard. The FileCard panel is then open with file metadata available for editing.

### `dashboard:file-edit-complete`

**Parameters:**

* `file` — The [File Object](https://uppy.io/docs/uppy/#File-Objects) representing the file that was edited.

Fired when the user finished editing the file metadata.

### `onDragOver(event)`

Callback for the [`ondragover`][ondragover] event handler.

### `onDrop(event)`

Callback for the [`ondrop`][ondrop] event handler.

### `onDragLeave(event)`

Callback for the [`ondragleave`][ondragleave] event handler.

<!-- definitions -->

[ondragover]: https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/ondragover

[ondragleave]: https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/ondragleave

[ondrop]: https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/ondrop
