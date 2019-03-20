# @uppy/store-default

<img src="https://uppy.io/images/logos/uppy-dog-head-arrow.svg" width="120" alt="Uppy logo: a superman puppy in a pink suit" align="right">

<a href="https://www.npmjs.com/package/@uppy/store-default"><img src="https://img.shields.io/npm/v/@uppy/store-default.svg?style=flat-square"></a>
<a href="https://travis-ci.org/transloadit/uppy"><img src="https://img.shields.io/travis/transloadit/uppy/master.svg?style=flat-square" alt="Build Status"></a>

A simple object-based store for Uppy. This one is used by default, you do not need to add it manually.

Uppy is being developed by the folks at [Transloadit](https://transloadit.com), a versatile file encoding service.

## Example

```js
const Uppy = require('@uppy/core')
const DefaultStore = require('@uppy/store-default')

const uppy = Uppy({
  store: DefaultStore()
})
```

## Installation

```bash
$ npm install @uppy/store-default --save
```

We recommend installing from npm and then using a module bundler such as [Webpack](https://webpack.js.org/), [Browserify](http://browserify.org/) or [Rollup.js](http://rollupjs.org/).

Alternatively, you can also use this package in a pre-built bundle from Transloadit's CDN: Edgly. In that case `Uppy` will attach itself to the global `window.Uppy` object. See the [main Uppy documentation](https://uppy.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the [Uppy website](https://uppy.io/docs/stores#DefaultStore).

## License

[The MIT License](./LICENSE).
