# @uppy/status-bar

<img src="https://uppy.io/img/logo.svg" width="120" alt="Uppy logo: a smiling puppy above a pink upwards arrow" align="right">

[![npm version](https://img.shields.io/npm/v/@uppy/status-bar.svg?style=flat-square)](https://www.npmjs.com/package/@uppy/status-bar)
![CI status for Uppy tests](https://github.com/transloadit/uppy/workflows/CI/badge.svg)
![CI status for Companion tests](https://github.com/transloadit/uppy/workflows/Companion/badge.svg)
![CI status for browser tests](https://github.com/transloadit/uppy/workflows/End-to-end%20tests/badge.svg)

The status-bar shows upload progress and speed, ETAs, pre- and post-processing
information, and allows users to control (pause/resume/cancel) the upload. Best
used together with a basic file source plugin, such as
[@uppy/file-input](https://uppy.io/docs/file-input) or
[@uppy/drag-drop](https://uppy.io/docs/drag-drop), or a custom implementation.
It’s also included in the [@uppy/dashboard](https://uppy.io/docs/dashboard)
plugin.

Uppy is being developed by the folks at [Transloadit](https://transloadit.com),
a versatile file encoding service.

## Example

```js
import Uppy from '@uppy/core'
import StatusBar from '@uppy/status-bar'

const uppy = new Uppy()
uppy.use(StatusBar, {
  target: 'body',
  hideUploadButton: false,
  showProgressDetails: false,
  hideAfterFinish: true,
})
```

## Installation

```bash
$ npm install @uppy/status-bar
```

Alternatively, you can also use this plugin in a pre-built bundle from
Transloadit’s CDN: Smart CDN. In that case `Uppy` will attach itself to the
global `window.Uppy` object. See the
[main Uppy documentation](https://uppy.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the
[Uppy website](https://uppy.io/docs/status-bar).

## License

[The MIT License](./LICENSE).
