# @uppy/file-input

<img src="https://uppy.io/img/logo.svg" width="120" alt="Uppy logo: a smiling puppy above a pink upwards arrow" align="right">

[![npm version](https://img.shields.io/npm/v/@uppy/file-input.svg?style=flat-square)](https://www.npmjs.com/package/@uppy/file-input)
![CI status for Uppy tests](https://github.com/transloadit/uppy/workflows/CI/badge.svg)
![CI status for Companion tests](https://github.com/transloadit/uppy/workflows/Companion/badge.svg)
![CI status for browser tests](https://github.com/transloadit/uppy/workflows/End-to-end%20tests/badge.svg)

FileInput is the most barebones UI for selecting files—it shows a single button
that, when clicked, opens up the browser’s file selector.

**[Read the docs](https://uppy.io/docs/file-input)** |
**[Try it](https://uppy.io/examples/xhrupload/)**

Uppy is being developed by the folks at [Transloadit](https://transloadit.com),
a versatile file encoding service.

## Example

```js
import Uppy from '@uppy/core'
import FileInput from '@uppy/file-input'

const uppy = new Uppy()
uppy.use(FileInput, {
  // Options
})
```

## Installation

```bash
$ npm install @uppy/file-input
```

Alternatively, you can also use this plugin in a pre-built bundle from
Transloadit’s CDN: Smart CDN. In that case `Uppy` will attach itself to the
global `window.Uppy` object. See the
[main Uppy documentation](https://uppy.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the
[Uppy website](https://uppy.io/docs/file-input).

## License

[The MIT License](./LICENSE).
