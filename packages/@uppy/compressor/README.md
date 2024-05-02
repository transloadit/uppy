# @uppy/compressor

<img src="https://uppy.io/img/logo.svg" width="120" alt="Uppy logo: a smiling puppy above a pink upwards arrow" align="right">

<a href="https://www.npmjs.com/package/@uppy/compressor"><img src="https://img.shields.io/npm/v/@uppy/compressor.svg?style=flat-square"></a>
<img src="https://github.com/transloadit/uppy/workflows/Tests/badge.svg" alt="CI status for Uppy tests">
<img src="https://github.com/transloadit/uppy/workflows/Companion/badge.svg" alt="CI status for Companion tests">
<img src="https://github.com/transloadit/uppy/workflows/End-to-end%20tests/badge.svg" alt="CI status for browser tests">

The Compressor plugin for Uppy optimizes images (JPEG, PNG, WEBP), saving on
average up to 60% in size (roughly 18 MB for 10 images). It uses
[Compressor.js](https://github.com/fengyuanchen/compressorjs).

Uppy is being developed by the folks at [Transloadit](https://transloadit.com),
a versatile file encoding service.

## Example

```js
import Uppy from '@uppy/core'
import Compressor from '@uppy/compressor'

const uppy = new Uppy()
uppy.use(Compressor)
```

## Installation

```bash
npm install @uppy/compressor
```

We recommend installing from yarn or npm, and then using a module bundler such
as [Parcel](https://parceljs.org/), [Vite](https://vitejs.dev/) or
[Webpack](https://webpack.js.org/).

Alternatively, you can also use this plugin in a pre-built bundle from
Transloadit’s CDN: Edgly. In that case `Uppy` will attach itself to the global
`window.Uppy` object. See the
[main Uppy documentation](https://uppy.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the
[Uppy website](https://uppy.io/docs/compressor).

## License

[The MIT License](./LICENSE).
