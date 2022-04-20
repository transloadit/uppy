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

Import general Core styles from `@uppy/core/dist/style.css` first, then add the Audio styles from `@uppy/audio/dist/style.css`. A minified version is also available as `style.min.css` at the same path. The way to do import depends on your build system.

## Options

The `@uppy/audio` plugin has the following configurable options:

### `id: 'Audio'`

A unique identifier for this plugin. It defaults to `'Audio'`.

### `target: null`

DOM element, CSS selector, or plugin to mount Audio into.

### `showAudioSourceDropdown: false`

Configures whether to show a dropdown which enables to choose the audio device to use. The default is `false`.

### `locale: {}`

<!-- eslint-disable no-restricted-globals, no-multiple-empty-lines -->

```js
export default {
  strings: {
    pluginNameAudio: 'Audio',
    // Used as the label for the button that starts an audio recording.
    // This is not visibly rendered but is picked up by screen readers.
    startAudioRecording: 'Begin audio recording',
    // Used as the label for the button that stops an audio recording.
    // This is not visibly rendered but is picked up by screen readers.
    stopAudioRecording: 'Stop audio recording',
    // Title on the “allow access” screen
    allowAudioAccessTitle: 'Please allow access to your microphone',
    // Description on the “allow access” screen
    allowAudioAccessDescription: 'In order to record audio, please allow microphone access for this site.',
    // Title on the “device not available” screen
    noAudioTitle: 'Microphone Not Available',
    // Description on the “device not available” screen
    noAudioDescription: 'In order to record audio, please connect a microphone or another audio input device',
    // Message about file size will be shown in an Informer bubble
    recordingStoppedMaxSize: 'Recording stopped because the file size is about to exceed the limit',
    // Used as the label for the counter that shows recording length (`1:25`).
    // This is not visibly rendered but is picked up by screen readers.
    recordingLength: 'Recording length %{recording_length}',
    // Used as the label for the submit checkmark button.
    // This is not visibly rendered but is picked up by screen readers.
    submitRecordedFile: 'Submit recorded file',
    // Used as the label for the discard cross button.
    // This is not visibly rendered but is picked up by screen readers.
    discardRecordedFile: 'Discard recorded file',
  },
}

```
