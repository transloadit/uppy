# @uppy/image-editor

<img src="https://uppy.io/img/logo.svg" width="120" alt="Uppy logo: a smiling puppy above a pink upwards arrow" align="right">

[![npm version](https://img.shields.io/npm/v/@uppy/image-editor.svg?style=flat-square)](https://www.npmjs.com/package/@uppy/image-editor)
![CI status for Uppy tests](https://github.com/transloadit/uppy/workflows/CI/badge.svg)
![CI status for Companion tests](https://github.com/transloadit/uppy/workflows/Companion/badge.svg)
![CI status for browser tests](https://github.com/transloadit/uppy/workflows/End-to-end%20tests/badge.svg)

Image Editor is an image cropping and editing plugin for Uppy. Designed to be
used with the Dashboard UI (can in theory work without it).

⚠ In beta.

**[Read the docs](https://uppy.io/docs/image-editor)** |
**[Try it](https://uppy.io/examples/dashboard/)**

Uppy is being developed by the folks at [Transloadit](https://transloadit.com),
a versatile file encoding service.

## Example

```js
import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import ImageEditor from '@uppy/image-editor'

const uppy = new Uppy()
uppy.use(Dashboard)
uppy.use(ImageEditor, { quality: 0.7 })
```

## Installation

```bash
$ npm install @uppy/image-editor
```

Alternatively, you can also use this plugin in a pre-built bundle from
Transloadit’s CDN: Smart CDN. In that case `Uppy` will attach itself to the
global `window.Uppy` object. See the
[main Uppy documentation](https://uppy.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the
[Uppy website](https://uppy.io/docs/image-editor).

## License

[The MIT License](./LICENSE).
