# @uppy/url

<img src="https://uppy.io/img/logo.svg" width="120" alt="Uppy logo: a smiling puppy above a pink upwards arrow" align="right">

[![npm version](https://img.shields.io/npm/v/@uppy/url.svg?style=flat-square)](https://www.npmjs.com/package/@uppy/url)
![CI status for Uppy tests](https://github.com/transloadit/uppy/workflows/CI/badge.svg)
![CI status for Companion tests](https://github.com/transloadit/uppy/workflows/Companion/badge.svg)
![CI status for browser tests](https://github.com/transloadit/uppy/workflows/End-to-end%20tests/badge.svg)

The Url plugin lets users import files from the Internet. Paste any URL and
it’ll be added!

A Companion instance is required for the Url plugin to work. Companion will
download the files and upload them to their destination. This saves bandwidth
for the user (especially on mobile connections) and helps avoid CORS
restrictions.

Uppy is being developed by the folks at [Transloadit](https://transloadit.com),
a versatile file encoding service.

## Example

```js
import Uppy from '@uppy/core'
import Url from '@uppy/url'

const uppy = new Uppy()
uppy.use(Url, {
  // Options
})
```

## Installation

```bash
$ npm install @uppy/url
```

Alternatively, you can also use this plugin in a pre-built bundle from
Transloadit’s CDN: Smart CDN. In that case `Uppy` will attach itself to the
global `window.Uppy` object. See the
[main Uppy documentation](https://uppy.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the
[Uppy website](https://uppy.io/docs/url).

## License

[The MIT License](./LICENSE).
