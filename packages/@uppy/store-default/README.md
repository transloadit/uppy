# @uppy/store-default

<img src="https://uppy.io/images/logos/uppy-dog-head-arrow.svg" width="120" alt="Uppy logo: a superman puppy in a pink suit" align="right">

[![npm version](https://img.shields.io/npm/v/@uppy/store-default.svg?style=flat-square)](https://www.npmjs.com/package/@uppy/store-default)
![CI status for Uppy tests](https://github.com/transloadit/uppy/workflows/Tests/badge.svg)
![CI status for Companion tests](https://github.com/transloadit/uppy/workflows/Companion/badge.svg)
![CI status for browser tests](https://github.com/transloadit/uppy/workflows/End-to-end%20tests/badge.svg)

A basic object-based store for Uppy. This one is used by default, you do not need to add it manually.

Uppy is being developed by the folks at [Transloadit](https://transloadit.com), a versatile file encoding service.

## Example

```js
import Uppy from '@uppy/core'
import DefaultStore from '@uppy/store-default'

const uppy = new Uppy({
  store: DefaultStore(),
})
```

## Installation

```bash
$ npm install @uppy/store-default
```

Alternatively, you can also use this package in a pre-built bundle from Transloadit’s CDN: Edgly. In that case `Uppy` will attach itself to the global `window.Uppy` object. See the [main Uppy documentation](https://uppy.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the [Uppy website](https://uppy.io/docs/stores#DefaultStore).

## License

[The MIT License](./LICENSE).
