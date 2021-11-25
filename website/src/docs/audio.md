---
type: docs
order: 3
title: "Audio"
module: "@uppy/audio"
permalink: docs/audio/
category: "Sources"
tagline: "upload audio recordings"
---

The `@uppy/audio` plugin lets you record audio using a built-in or external microphone, or any other audio device, on desktop and mobile.

```js
import Audio from '@uppy/audio'

uppy.use(Audio, {
  // Options
})
```

<a class="TryButton" href="/examples/dashboard/">Try it live</a>

## Installation

This plugin is published as the `@uppy/audio` package.

Install from NPM:

```shell
npm install @uppy/audio
```

In the [CDN package](/docs/#With-a-script-tag), the plugin class is available on the `Uppy` global object:

```js
const { Audio } = Uppy
```

## CSS

The `@uppy/audio` plugin requires the following CSS for styling:

```js
import '@uppy/core/dist/style.css'
import '@uppy/audio/dist/style.css'
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the Webcam styles from `@uppy/audio/dist/style.css`. A minified version is also available as `style.min.css` at the same path. The way to do import depends on your build system.

## Options

The `@uppy/webcam` plugin has the following configurable options:

### `id: 'Audio'`

A unique identifier for this plugin. It defaults to `'Webcam'`.

### `target: null`

DOM element, CSS selector, or plugin to mount Audio into.

### `showAudioSourceDropdown: false`

Configures whether to show a dropdown which enables to choose the audio device to use. The default is `false`.

### `locale: {}`

<!-- eslint-disable no-restricted-globals, no-multiple-empty-lines -->
