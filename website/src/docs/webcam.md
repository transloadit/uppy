---
type: docs
order: 26
title: "Webcam"
permalink: docs/webcam/
---

The Webcam plugin lets you take photos and record videos with a built-in camera on desktop and mobile devices.

[Try live!](/examples/dashboard/)

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
  mirror: true,
  facingMode: 'user',
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

### `mirror: true`

Whether to mirror preview image from the camera. This option is useful when taking a selfie with a front camera: when you wave your right hand, you will see your hand on the right on the preview screen, like in the mirror. But when you actually take a picture, it will not be mirrored. This is how smartphone selfie cameras behave.

### `facingMode: 'user'`

Devices sometimes have multiple cameras, front and back, for example. There’s a browser API to set which camera will be used, [facingMode](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/facingMode):

- `user`: The video source is facing toward the user; this includes, for example, the front-facing camera on a smartphone.
- `environment`:  The video source is facing away from the user, thereby viewing their environment. This is the back camera on a smartphone.
- `left`: The video source is facing toward the user but to their left, such as a camera aimed toward the user but over their left shoulder.
- `right`: The video source is facing toward the user but to their right, such as a camera aimed toward the user but over their right shoulder.


### `locale: {}`

There is only one localizable string: `strings.smile`. It's shown before a picture is taken, when the `countdown` option is set to true.
