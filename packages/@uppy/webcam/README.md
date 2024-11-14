# @uppy/webcam

<img src="https://uppy.io/img/logo.svg" width="120" alt="Uppy logo: a smiling puppy above a pink upwards arrow" align="right">

[![npm version](https://img.shields.io/npm/v/@uppy/webcam.svg?style=flat-square)](https://www.npmjs.com/package/@uppy/webcam)
![CI status for Uppy tests](https://github.com/transloadit/uppy/workflows/CI/badge.svg)
![CI status for Companion tests](https://github.com/transloadit/uppy/workflows/Companion/badge.svg)
![CI status for browser tests](https://github.com/transloadit/uppy/workflows/End-to-end%20tests/badge.svg)

The Webcam plugin for Uppy lets you take photos and record videos with a
built-in camera on desktop and mobile devices.

Uppy is being developed by the folks at [Transloadit](https://transloadit.com),
a versatile file encoding service.

## Example

```js
import Uppy from '@uppy/core'
import Webcam from '@uppy/webcam'

const uppy = new Uppy()
uppy.use(Webcam, {
  mirror: true,
  facingMode: 'user',
  showRecordingLength: true,
})
```

## Installation

```bash
$ npm install @uppy/webcam
```

Alternatively, you can also use this plugin in a pre-built bundle from
Transloadit’s CDN: Smart CDN. In that case `Uppy` will attach itself to the
global `window.Uppy` object. See the
[main Uppy documentation](https://uppy.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the
[Uppy website](https://uppy.io/docs/webcam).

## License

[The MIT License](./LICENSE).
