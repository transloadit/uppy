---
type: docs
order: 26
title: "Webcam"
permalink: docs/webcam/
---


[Try it live](/examples/dashboard/) - The Informer is included in the Dashboard by default.

## Options

```js
uppy.use(Webcam, {
  onBeforeSnapshot: () => Promise.resolve(),
  countdown: false,
  modes: [
    'video-audio',
    'video-only',
    'audio-only',
    'picture'
  ],
  locale: {
    strings: {
      smile: 'Smile!'
    }
  }
})
```

### `target: null`

DOM element, CSS selector, or plugin to mount the informer into.

### `countdown: false`

When taking a picture: the amount of seconds to wait before actually taking a snapshot. If `false` or 0, the timeout is disabled entirely.
This also shows a 'Smile!' message in the [Informer](/docs/informer) before the picture is taken.

### `onBeforeSnapshot: () => Promise.resolve()`

A hook function to call before a snapshot is taken. The Webcam plugin will wait for the returned Promise to resolve before taking the snapshot. This can be used to implement variations on the `countdown` option for example.

### `modes: []`

The types of recording modes to allow.

 - `video-audio` - Record a video file, capturing both audio and video.
 - `video-only` - Record a video file with the webcam, but don't record audio.
 - `audio-only` - Record an audio file with the user's microphone.
 - `picture` - Take a picture with the webcam.

By default, all modes are allowed, and the Webcam plugin will show controls for recording video as well as taking pictures.

### `locale: {}`

There is only one localizable string: `strings.smile`. It's shown before a picture is taken, when the `countdown` option is set to true.
