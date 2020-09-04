# @uppy/xhr-upload

<img src="https://uppy.io/images/logos/uppy-dog-head-arrow.svg" width="120" alt="Uppy logo: a superman puppy in a pink suit" align="right">

<a href="https://www.npmjs.com/package/@uppy/xhr-upload"><img src="https://img.shields.io/npm/v/@uppy/xhr-upload.svg?style=flat-square"></a>
<a href="https://travis-ci.org/transloadit/uppy"><img src="https://img.shields.io/travis/transloadit/uppy/master.svg?style=flat-square" alt="Build Status"></a>

The XHRUpload plugin handles classic XHR uploads with Uppy. If you have an exiting Apache/Nginx/Node or whatever backend, this is probably the Uppy uploader plugin you are looking for.

Uppy is being developed by the folks at [Transloadit](https://transloadit.com), a versatile file encoding service.

## Example

```js
const Uppy = require('@uppy/core')
const XHRUpload = require('@uppy/xhr-upload')

const uppy = new Uppy()
uppy.use(Uppy, {
  // Options
})
```

## Installation

```bash
$ npm install @uppy/xhr-upload
```

We recommend installing from npm and then using a module bundler such as [Webpack](https://webpack.js.org/), [Browserify](http://browserify.org/) or [Rollup.js](http://rollupjs.org/).

Alternatively, you can also use this plugin in a pre-built bundle from Transloadit's CDN: Edgly. In that case `Uppy` will attach itself to the global `window.Uppy` object. See the [main Uppy documentation](https://uppy.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the [Uppy website](https://uppy.io/docs/xhr-upload).

## License

[The MIT License](./LICENSE).
