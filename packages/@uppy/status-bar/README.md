# @uppy/status-bar

<img src="https://uppy.io/images/logos/uppy-dog-head-arrow.svg" width="120" alt="Uppy logo: a superman puppy in a pink suit" align="right">

<a href="https://www.npmjs.com/package/@uppy/status-bar"><img src="https://img.shields.io/npm/v/@uppy/status-bar.svg?style=flat-square"></a>
<a href="https://travis-ci.org/transloadit/uppy"><img src="https://img.shields.io/travis/transloadit/uppy/master.svg?style=flat-square" alt="Build Status"></a>

The status-bar shows upload progress and speed, ETAs, pre- and post-processing information, and allows users to control (pause/resume/cancel) the upload.
Best used together with a simple file source plugin, such as [@uppy/file-input](https://uppy.io/docs/file-input) or [@uppy/drag-drop](https://uppy.io/docs/drag-drop), or a custom implementation. It is also included in the [@uppy/dashboard](https://uppy.io/docs/dashboard) plugin.

Uppy is being developed by the folks at [Transloadit](https://transloadit.com), a versatile file encoding service.

## Example

```js
const Uppy = require('@uppy/core')
const StatusBar = require('@uppy/status-bar')

const uppy = Uppy()
uppy.use(StatusBar, {
  target: 'body',
  hideUploadButton: false,
  showProgressDetails: false,
  hideAfterFinish: true
})
```

## Installation

```bash
$ npm install @uppy/status-bar --save
```

We recommend installing from npm and then using a module bundler such as [Webpack](https://webpack.js.org/), [Browserify](http://browserify.org/) or [Rollup.js](http://rollupjs.org/).

Alternatively, you can also use this plugin in a pre-built bundle from Transloadit's CDN: Edgly. In that case `Uppy` will attach itself to the global `window.Uppy` object. See the [main Uppy documentation](https://uppy.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the [Uppy website](https://uppy.io/docs/status-bar).

## License

[The MIT License](./LICENSE).
