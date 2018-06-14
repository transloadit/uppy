# @uppy/file-input

<img src="https://uppy.io/images/logos/uppy-dog-head-arrow.svg" width="120" alt="Uppy logo: a superman puppy in a pink suit" align="right">

<a href="https://www.npmjs.com/package/@uppy/PLUGINNAME"><img src="https://img.shields.io/npm/v/@uppy/PLUGINNAME.svg?style=flat-square"></a>
<a href="https://travis-ci.org/transloadit/uppy"><img src="https://img.shields.io/travis/transloadit/uppy/master.svg?style=flat-square" alt="Build Status"></a>

FileInput is the most barebones UI for selecting files—it shows a single button that, when clicked, opens up the browser’s file selector.

**[Read the docs](https://uppy.io/docs/fileinput)** | **[Try it](https://uppy.io/examples/xhrupload/)**

Uppy is being developed by the folks at [Transloadit](https://transloadit.com), a versatile file encoding service.

## Example

```js
const Uppy = require('@uppy/core')
const FileInput = require('@uppy/file-input')

const uppy = Uppy()
uppy.use(FileInput, {
  // Options
})
```

## Installation

```bash
$ npm install @uppy/file-input --save
```

We recommend installing from npm and then using a module bundler such as [Webpack](http://webpack.github.io/), [Browserify](http://browserify.org/) or [Rollup.js](http://rollupjs.org/).

Alternatively, you can also use this plugin in a pre-built bundle from Transloadit's CDN: Edgly. In that case `Uppy` will attach itself to the global `window.Uppy` object. See the [main Uppy documentation](https://uppy.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the [Uppy website](https://uppy.io/docs/fileinput).

## License

[The MIT License](./LICENSE).
