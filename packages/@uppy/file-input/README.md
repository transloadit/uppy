# @uppy/file-input

<img src="https://uppy.io/images/logos/uppy-dog-head-arrow.svg" width="120" alt="Uppy logo: a superman puppy in a pink suit" align="right">

<a href="https://www.npmjs.com/package/@uppy/file-input"><img src="https://img.shields.io/npm/v/@uppy/file-input.svg?style=flat-square"></a>
<img src="https://github.com/transloadit/uppy/workflows/Tests/badge.svg" alt="CI status for Uppy tests"> <img src="https://github.com/transloadit/uppy/workflows/Companion/badge.svg" alt="CI status for Companion tests"> <img src="https://github.com/transloadit/uppy/workflows/End-to-end%20tests/badge.svg" alt="CI status for browser tests">

FileInput is the most barebones UI for selecting files—it shows a single button that, when clicked, opens up the browser’s file selector.

**[Read the docs](https://uppy.io/docs/fileinput)** | **[Try it](https://uppy.io/examples/xhrupload/)**

Uppy is being developed by the folks at [Transloadit](https://transloadit.com), a versatile file encoding service.

## Example

```js
const Uppy = require('@uppy/core')
const FileInput = require('@uppy/file-input')

const uppy = new Uppy()
uppy.use(FileInput, {
  // Options
})
```

## Installation

```bash
$ npm install @uppy/file-input
```

We recommend installing from npm and then using a module bundler such as [Webpack](https://webpack.js.org/), [Browserify](http://browserify.org/) or [Rollup.js](http://rollupjs.org/).

Alternatively, you can also use this plugin in a pre-built bundle from Transloadit's CDN: Edgly. In that case `Uppy` will attach itself to the global `window.Uppy` object. See the [main Uppy documentation](https://uppy.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the [Uppy website](https://uppy.io/docs/fileinput).

## License

[The MIT License](./LICENSE).
