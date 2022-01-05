---
type: docs
order: 4
title: "Screen capture"
module: "@uppy/screen-capture"
permalink: docs/screen-capture/
category: "Sources"
tagline: "upload selfies or audio / video recordings"
---

The `@uppy/screen-capture` plugin can record your screen or an application and save it as a video.

> To use the screen capture plugin in a Chromium-based browser, [your site must be served over https](https://developers.google.com/web/updates/2015/10/chrome-47-webrtc#public_service_announcements). This restriction does not apply on `localhost`, so you don’t have to jump through many hoops during development.

```js
import ScreenCapture from '@uppy/screen-capture'

uppy.use(ScreenCapture, {
  // Options
})
```

<a class="TryButton" href="/examples/dashboard/">Try it live</a>

## Installation

This plugin is published as the `@uppy/screen-capture` package.

Install from NPM:

```shell
npm install @uppy/screen-capture
```

In the [CDN package](/docs/#With-a-script-tag), the plugin class is available on the `Uppy` global object:

```js
const { ScreenCapture } = Uppy
```

## CSS

The `@uppy/screen-capture` plugin requires the following CSS for styling:

```js
import '@uppy/core/dist/style.css'
import '@uppy/screen-capture/dist/style.css'
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the ScreenCapture styles from `@uppy/screen-capture/dist/style.css`. A minified version is also available as `style.min.css` at the same path. The way to do import depends on your build system.

## Options

The `@uppy/screen-capture` plugin has the following configurable options:

```js
uppy.use(ScreenCapture, {
  displayMediaConstraints: {
    video: {
      width: 1280,
      height: 720,
      frameRate: {
        ideal: 3,
        max: 5,
      },
      cursor: 'motion',
      displaySurface: 'monitor',
    },
  },
  userMediaConstraints: {
    audio: true,
  },
  preferredVideoMimeType: 'video/webm',
})
```

### `id: 'ScreenCapture'`

A unique identifier for this plugin. It defaults to `'ScreenCapture'`.

### `title: 'Screen capture'`

Configures the title / name shown in the UI, for instance, on Dashboard tabs. It defaults to `'Screen capture'`.

### `target: null`

DOM element, CSS selector, or plugin to mount ScreenCapture into.

### `displayMediaConstraints`

Options passed to [`MediaDevices.getDisplayMedia()`](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia).  See the [`MediaTrackConstraints`](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints) for a list of options.

### `userMediaConstraints`

Options passed to [`MediaDevices.getUserMedia()`](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).  See the [`MediaTrackConstraints`](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints) for a list of options.

### `preferredVideoMimeType: null`

Set the preferred mime type for video recordings, for example `'video/webm'`. If the browser supports the given mime type, the video will be recorded in this format. If the browser does not support it, it will use the browser default.

If no preferred video mime type is given, the ScreenCapture plugin will prefer types listed in the [`allowedFileTypes` restriction](/docs/uppy/#restrictions), if any.

### `locale: {}`

<!-- eslint-disable no-restricted-globals, no-multiple-empty-lines -->

```js
module.exports = {
  strings: {
    startCapturing: 'Begin screen capturing',
    stopCapturing: 'Stop screen capturing',
    submitRecordedFile: 'Submit recorded file',
    streamActive: 'Stream active',
    streamPassive: 'Stream passive',
    micDisabled: 'Microphone access denied by user',
    recording: 'Recording',
  },
}

```
