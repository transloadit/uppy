# @uppy/react

<img src="https://uppy.io/images/logos/uppy-dog-head-arrow.svg" width="120" alt="Uppy logo: a superman puppy in a pink suit" align="right">

<a href="https://www.npmjs.com/package/@uppy/react"><img src="https://img.shields.io/npm/v/@uppy/react.svg?style=flat-square"></a>
<a href="https://travis-ci.org/transloadit/uppy"><img src="https://img.shields.io/travis/transloadit/uppy/master.svg?style=flat-square" alt="Build Status"></a>

React component wrappers around Uppy's officially maintained UI plugins.

Uppy is being developed by the folks at [Transloadit](https://transloadit.com), a versatile file encoding service.

## Example

```js
const Uppy = require('@uppy/core')
const { DashboardModal } = require('@uppy/react')

const uppy = Uppy()

class Example extends React.Component {
  state = { open: false }
  render () {
    return (
      <DashboardModal
        uppy={uppy}
        open={this.state.open}
        onRequestClose={this.handleClose}
      />
    )
  }
  // ..snip..
}
```

## Installation

```bash
$ npm install @uppy/react --save
```

We recommend installing from npm and then using a module bundler such as [Webpack](http://webpack.github.io/), [Browserify](http://browserify.org/) or [Rollup.js](http://rollupjs.org/).

Alternatively, you can also use this plugin in a pre-built bundle from Transloadit's CDN: Edgly. In that case `Uppy` will attach itself to the global `window.Uppy` object. See the [main Uppy documentation](https://uppy.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the [Uppy website](https://uppy.io/docs/react).

## License

[The MIT License](./LICENSE).
