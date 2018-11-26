---
type: docs
title: "File Picker API Documentation"
permalink: docs/transloadit-preset/picker/
hidden: true
---

Show a modal UI that allows users to pick files from their device and from the web. It uploads files to Transloadit for processing.

```js
const resultPromise = transloadit.pick(target, {
  params: {
    auth: { key: '' },
    template_id: ''
  }
})
```

## `target`

DOM element or CSS selector to place the modal element in. `document.body` is usually fine in this case because the modal is absolutely positioned on top of everything anyway.

## Providers

Providers import files from third party services using [Uppy Companion][companion] or from local sources like the device camera.

By default, the Picker will use Transloadit's [Uppy Companion][companion] servers for imports from third party service. You can self-host your own instances as well.

### `providers: []`

Array of providers to use. Each entry is the name of a provider. The available ones are:

- `'dropbox'` – Import files from Dropbox using [Uppy Companion][companion].
- `'google-drive'` – Import files from Google Drive using [Uppy Companion][companion].
- `'instagram'` – Import files from Instagram using [Uppy Companion][companion].
- `'url'` – Import files from public Web URLs using [Uppy Companion][companion].
- `'webcam'` – Take photos and record videos using thee user's device camera.

### `serverUrl: Transloadit.COMPANION`

The URL to a [Uppy Companion][companion] server to use.

### `serverPattern: Transloadit.COMPANION_PATTERN`

The valid and authorised URL(s) from which OAuth responses should be accepted.

This value can be a `String`, a `Regex` pattern, or an `Array` of both.

This is useful when you have your [Uppy Companion][companion] running on multiple hosts. Otherwise, the default value should do just fine.

### `serverHeaders: {}`

Custom headers to send to [Uppy Companion][companion].

### `dropbox: {}`

Specific options for the [Dropbox](/docs/dropbox) provider.

### `googleDrive: {}`

Specific options for the [Google Drive](/docs/google-drive) provider.

### `instagram: {}`

Specific options for the [Instagram](/docs/instagram) provider.

### `url: {}`

Specific options for the [URL](/docs/url) provider.

### `webcam: {}`

Specific options for the [Webcam](/docs/webcam) provider.

[companion]: /docs/companion
