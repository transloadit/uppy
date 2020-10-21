# @uppy/dashboard

<img src="https://uppy.io/images/logos/uppy-dog-head-arrow.svg" width="120" alt="Uppy logo: a superman puppy in a pink suit" align="right">

<a href="https://www.npmjs.com/package/@uppy/dashboard"><img src="https://img.shields.io/npm/v/@uppy/dashboard.svg?style=flat-square"></a>
<a href="https://travis-ci.org/transloadit/uppy"><img src="https://img.shields.io/travis/transloadit/uppy/master.svg?style=flat-square" alt="Build Status"></a>

Dashboard is a universal UI plugin for Uppy:

 * Drag and Drop, paste, select from local disk / my device
 * UI for Webcam and remote sources: Google Drive, Dropbox, Instagram (all optional, added via plugins)
 * File previews and info
 * Metadata editor
 * Progress: total and for individual files
 * Ability to pause/resume or cancel (depending on uploader plugin) individual or all files

**[Read the docs](https://uppy.io/docs/dashboard/)** | **[Try it](https://uppy.io/examples/dashboard/)**

Uppy is being developed by the folks at [Transloadit](https://transloadit.com), a versatile file encoding service.

## Example

```js
const Uppy = require('@uppy/core')
const Dashboard = require('@uppy/dashboard')

const uppy = new Uppy()
uppy.use(Dashboard, {
  target: 'body',
  inline: true
})
```

## Installation

```bash
$ npm install @uppy/dashboard
```

We recommend installing from npm and then using a module bundler such as [Webpack](https://webpack.js.org/), [Browserify](http://browserify.org/) or [Rollup.js](http://rollupjs.org/).

Alternatively, you can also use this plugin in a pre-built bundle from Transloadit's CDN: Edgly. In that case `Uppy` will attach itself to the global `window.Uppy` object. See the [main Uppy documentation](https://uppy.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the [Uppy website](https://uppy.io/docs/dashboard).

## License

[The MIT License](./LICENSE).
