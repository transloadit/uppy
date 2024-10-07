# @uppy/audio

<img src="https://uppy.io/img/logo.svg" width="120" alt="Uppy logo: a smiling puppy above a pink upwards arrow" align="right">

<a href="https://www.npmjs.com/package/@uppy/audio"><img src="https://img.shields.io/npm/v/@uppy/webcam.svg?style=flat-square"></a>
<img src="https://github.com/transloadit/uppy/workflows/Tests/badge.svg" alt="CI status for Uppy tests">
<img src="https://github.com/transloadit/uppy/workflows/Companion/badge.svg" alt="CI status for Companion tests">
<img src="https://github.com/transloadit/uppy/workflows/End-to-end%20tests/badge.svg" alt="CI status for browser tests">

The Audio plugin for Uppy lets you record audio using a built-in or external
microphone, or any other audio device, on desktop and mobile.

Uppy is being developed by the folks at [Transloadit](https://transloadit.com),
a versatile file encoding service.

## Example

```js
import Uppy from '@uppy/core'
import Audio from '@uppy/audio'

const uppy = new Uppy()
uppy.use(Audio)
```

## Installation

```bash
$ npm install @uppy/audio
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
