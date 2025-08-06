# @uppy/dropbox

<img src="https://uppy.io/img/logo.svg" width="120" alt="Uppy logo: a smiling puppy above a pink upwards arrow" align="right">

[![npm version](https://img.shields.io/npm/v/@uppy/dropbox.svg?style=flat-square)](https://www.npmjs.com/package/@uppy/dropbox)
![CI status for Uppy tests](https://github.com/transloadit/uppy/workflows/CI/badge.svg)
![CI status for Companion tests](https://github.com/transloadit/uppy/workflows/Companion/badge.svg)
![CI status for browser tests](https://github.com/transloadit/uppy/workflows/End-to-end%20tests/badge.svg)

The Dropbox plugin for Uppy lets users import files from their Dropbox account.

A Companion instance is required for the Dropbox plugin to work. Companion
handles authentication with Dropbox, downloads files from Dropbox and uploads
them to the destination. This saves the user bandwidth, especially helpful if
they are on a mobile connection.

Uppy is being developed by the folks at [Transloadit](https://transloadit.com),
a versatile file encoding service.

## Example

```js
import Uppy from '@uppy/core'
import Dropbox from '@uppy/dropbox'

const uppy = new Uppy()
uppy.use(Dropbox, {
  // Options
})
```

## Installation

```bash
$ npm install @uppy/dropbox
```

Alternatively, you can also use this plugin in a pre-built bundle from
Transloadit’s CDN: Smart CDN. In that case `Uppy` will attach itself to the
global `window.Uppy` object. See the
[main Uppy documentation](https://uppy.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the
[Uppy website](https://uppy.io/docs/dropbox).

## License

[The MIT License](./LICENSE).
