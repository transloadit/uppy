# @uppy/box

<img src="https://uppy.io/images/logos/uppy-dog-head-arrow.svg" width="120" alt="Uppy logo: a superman puppy in a pink suit" align="right">

<a href="https://www.npmjs.com/package/@uppy/box"><img src="https://img.shields.io/npm/v/@uppy/box.svg?style=flat-square"></a>
<a href="https://travis-ci.org/transloadit/uppy"><img src="https://img.shields.io/travis/transloadit/uppy/master.svg?style=flat-square" alt="Build Status"></a>

The Box plugin for Uppy lets users import files from their Box account.

A Companion instance is required for the Box plugin to work. Companion handles authentication with Box, downloads files from Box and uploads them to the destination. This saves the user bandwidth, especially helpful if they are on a mobile connection.

Uppy is being developed by the folks at [Transloadit](https://transloadit.com), a versatile file encoding service.

## Example

```js
const Uppy = require('@uppy/core')
const Box = require('@uppy/box')

const uppy = new Uppy()
uppy.use(Box, {
  // Options
})
```

## Installation

```bash
$ npm install @uppy/box
```

We recommend installing from npm and then using a module bundler such as [Webpack](https://webpack.js.org/), [Browserify](http://browserify.org/) or [Rollup.js](http://rollupjs.org/).

Alternatively, you can also use this plugin in a pre-built bundle from Transloadit's CDN: Edgly. In that case `Uppy` will attach itself to the global `window.Uppy` object. See the [main Uppy documentation](https://uppy.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the [Uppy website](https://uppy.io/docs/box).

## License

[The MIT License](./LICENSE).
