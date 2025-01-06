# @uppy/xhr-upload

<img src="https://uppy.io/img/logo.svg" width="120" alt="Uppy logo: a smiling puppy above a pink upwards arrow" align="right">

[![npm version](https://img.shields.io/npm/v/@uppy/xhr-upload.svg?style=flat-square)](https://www.npmjs.com/package/@uppy/xhr-upload)
![CI status for Uppy tests](https://github.com/transloadit/uppy/workflows/CI/badge.svg)
![CI status for Companion tests](https://github.com/transloadit/uppy/workflows/Companion/badge.svg)
![CI status for browser tests](https://github.com/transloadit/uppy/workflows/End-to-end%20tests/badge.svg)

The XHRUpload plugin handles classic XHR uploads with Uppy. If you have an
exiting Apache/Nginx/Node or whatever backend, this is probably the Uppy
uploader plugin you are looking for.

Uppy is being developed by the folks at [Transloadit](https://transloadit.com),
a versatile file encoding service.

## Example

```js
import Uppy from '@uppy/core'
import XHRUpload from '@uppy/xhr-upload'

const uppy = new Uppy()
uppy.use(XHRUpload, {
  // Options
})
```

## Installation

```bash
$ npm install @uppy/xhr-upload
```

Alternatively, you can also use this plugin in a pre-built bundle from
Transloadit’s CDN: Smart CDN. In that case `Uppy` will attach itself to the
global `window.Uppy` object. See the
[main Uppy documentation](https://uppy.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the
[Uppy website](https://uppy.io/docs/xhr-upload).

## License

[The MIT License](./LICENSE).
