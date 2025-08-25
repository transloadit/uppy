# @uppy/zoom

<img src="https://uppy.io/img/logo.svg" width="120" alt="Uppy logo: a smiling puppy above a pink upwards arrow" align="right">

[![npm version](https://img.shields.io/npm/v/@uppy/zoom.svg?style=flat-square)](https://www.npmjs.com/package/@uppy/zoom)
![CI status for Uppy tests](https://github.com/transloadit/uppy/workflows/CI/badge.svg)
![CI status for Companion tests](https://github.com/transloadit/uppy/workflows/Companion/badge.svg)
![CI status for browser tests](https://github.com/transloadit/uppy/workflows/End-to-end%20tests/badge.svg)

The Zoom plugin for Uppy lets users import recordings and related files from
their Zoom account.

A Companion instance and zoom account with cloud recordings is required for the
Zoom plugin to work. Companion handles authentication with Zoom, downloads files
from Zoom and uploads them to the destination. This saves the user bandwidth,
especially helpful if they are on a mobile connection.

Uppy is being developed by the folks at [Transloadit](https://transloadit.com),
a versatile file encoding service.

## Example

```js
import Uppy from '@uppy/core'
import Zoom from '@uppy/zoom'

const uppy = new Uppy()
uppy.use(Zoom, {
  // Options
})
```

## Installation

```bash
$ npm install @uppy/zoom
```

Alternatively, you can also use this plugin in a pre-built bundle from
Transloadit’s CDN: Smart CDN. In that case `Uppy` will attach itself to the
global `window.Uppy` object. See the
[main Uppy documentation](https://uppy.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the
[Uppy website](https://uppy.io/docs/zoom).

## License

[The MIT License](./LICENSE).
