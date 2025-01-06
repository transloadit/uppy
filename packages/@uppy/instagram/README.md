# @uppy/instagram

<img src="https://uppy.io/img/logo.svg" width="120" alt="Uppy logo: a smiling puppy above a pink upwards arrow" align="right">

[![npm version](https://img.shields.io/npm/v/@uppy/instagram.svg?style=flat-square)](https://www.npmjs.com/package/@uppy/instagram)
![CI status for Uppy tests](https://github.com/transloadit/uppy/workflows/CI/badge.svg)
![CI status for Companion tests](https://github.com/transloadit/uppy/workflows/Companion/badge.svg)
![CI status for browser tests](https://github.com/transloadit/uppy/workflows/End-to-end%20tests/badge.svg)

The Instagram plugin lets users import photos from their Instagram account.

A [Companion](https://uppy.io/docs/companion) instance is required for the
Instagram plugin to work. Companion handles authentication with Instagram,
downloads the pictures and videos, and uploads them to the destination. This
saves the user bandwidth, especially helpful if they are on a mobile connection.

Uppy is being developed by the folks at [Transloadit](https://transloadit.com),
a versatile file encoding service.

## Example

```js
import Uppy from '@uppy/core'
import Instagram from '@uppy/instagram'

const uppy = new Uppy()
uppy.use(Instagram, {})
```

## Installation

```bash
$ npm install @uppy/instagram
```

Alternatively, you can also use this plugin in a pre-built bundle from
Transloadit’s CDN: Smart CDN. In that case `Uppy` will attach itself to the
global `window.Uppy` object. See the
[main Uppy documentation](https://uppy.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the
[Uppy website](https://uppy.io/docs/instagram).

## License

[The MIT License](./LICENSE).
