# @uppy/store-redux

<img src="https://uppy.io/images/logos/uppy-dog-head-arrow.svg" width="120" alt="Uppy logo: a superman puppy in a pink suit" align="right">

<a href="https://www.npmjs.com/package/@uppy/store-redux"><img src="https://img.shields.io/npm/v/@uppy/store-redux.svg?style=flat-square"></a>
<a href="https://travis-ci.org/transloadit/uppy"><img src="https://img.shields.io/travis/transloadit/uppy/master.svg?style=flat-square" alt="Build Status"></a>

The `ReduxStore` stores Uppy state on a key in an existing Redux store.
The `ReduxStore` dispatches `uppy/STATE_UPDATE` actions to update state.
When the state in Redux changes, it notifies Uppy.
This way, you get most of the benefits of Redux, including support for the Redux Devtools and time traveling!

Uppy is being developed by the folks at [Transloadit](https://transloadit.com), a versatile file encoding service.

## Example

```js
const { combineReducers, createStore } = require('redux')
const Uppy = require('@uppy/core')
const ReduxStore = require('@uppy/store-redux')
const reducers = require('./reducers')

const reducer = combineReducers({
  ...reducers,
  uppy: ReduxStore.reducer
})

const store = createStore(reducer)

const uppy = Uppy({
  store: ReduxStore({
    store: store
  })
})
```

## Installation

```bash
$ npm install @uppy/store-redux --save
```

We recommend installing from npm and then using a module bundler such as [Webpack](http://webpack.github.io/), [Browserify](http://browserify.org/) or [Rollup.js](http://rollupjs.org/).

Alternatively, you can also use this plugin in a pre-built bundle from Transloadit's CDN: Edgly. In that case `Uppy` will attach itself to the global `window.Uppy` object. See the [main Uppy documentation](https://uppy.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the [Uppy website](https://uppy.io/docs/DOC_PAGE_HERE).

## License

[The MIT License](./LICENSE).
