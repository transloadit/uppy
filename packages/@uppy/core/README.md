# @uppy/core

<img src="https://uppy.io/images/logos/uppy-dog-head-arrow.svg" width="120" alt="Uppy logo: a superman puppy in a pink suit" align="right">

<a href="https://www.npmjs.com/package/@uppy/core"><img src="https://img.shields.io/npm/v/@uppy/core.svg?style=flat-square"></a>
<a href="https://travis-ci.org/transloadit/uppy"><img src="https://img.shields.io/travis/transloadit/uppy/master.svg?style=flat-square" alt="Build Status"></a>

Uppy is a sleek, modular JavaScript file uploader that integrates seamlessly with any application. It’s fast, easy to use and lets you worry about more important problems than building a file uploader.

- **Fetch** files from local disk, remote urls, Google Drive, Dropbox, Instagram, or snap and record selfies with a camera;
- **Preview** and edit metadata with a nice interface;
- **Upload** to the final destination, optionally process/encode

**[Read the docs](https://uppy.io/docs)** | **[Try Uppy](https://uppy.io/examples/dashboard/)**

Uppy is being developed by the folks at [Transloadit](https://transloadit.com), a versatile file encoding service.

## Example

```js
const Uppy = require('@uppy/core')

const uppy = Uppy({ autoProceed: false })
uppy.use(SomePlugin)
```

## Installation

```bash
$ npm install @uppy/core --save
```

We recommend installing from npm and then using a module bundler such as [Webpack](http://webpack.github.io/), [Browserify](http://browserify.org/) or [Rollup.js](http://rollupjs.org/).

Alternatively, you can also use this plugin in a pre-built bundle from Transloadit's CDN: Edgly. In that case `Uppy` will attach itself to the global `window.Uppy` object. See the [main Uppy documentation](https://uppy.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the [Uppy website](https://uppy.io/docs/DOC_PAGE_HERE).

## License

[The MIT License](./LICENSE).
