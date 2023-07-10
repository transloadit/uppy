# @uppy/store-redux

<img src="https://uppy.io/img/logo.svg" width="120" alt="Uppy logo: a smiling puppy above a pink upwards arrow" align="right">

[![npm version](https://img.shields.io/npm/v/@uppy/store-redux.svg?style=flat-square)](https://www.npmjs.com/package/@uppy/store-redux)
![CI status for Uppy tests](https://github.com/transloadit/uppy/workflows/Tests/badge.svg)
![CI status for Companion tests](https://github.com/transloadit/uppy/workflows/Companion/badge.svg)
![CI status for browser tests](https://github.com/transloadit/uppy/workflows/End-to-end%20tests/badge.svg)

The `ReduxStore` stores Uppy state on a key in an existing Redux store.
The `ReduxStore` dispatches `uppy/STATE_UPDATE` actions to update state.
When the state in Redux changes, it notifies Uppy.
This way, you get most of the benefits of Redux, including support for the Redux Devtools and time traveling!

Uppy is being developed by the folks at [Transloadit](https://transloadit.com), a versatile file encoding service.

## Example

```js
import Uppy from '@uppy/core'
import * as ReduxStore from '@uppy/store-redux'
import * as Redux from 'redux'

function createStore (reducers = {}) {
  const reducer = Redux.combineReducers({ ...reducers, uppy: ReduxStore.reducer })
  return Redux.createStore(reducer)
}

const store = new ReduxStore.ReduxStore({ store: createStore() })
const uppy = new Uppy({ store })
```

## Installation

```bash
$ npm install @uppy/store-redux
```

Alternatively, you can also use this plugin in a pre-built bundle from Transloadit’s CDN: Edgly. In that case `Uppy` will attach itself to the global `window.Uppy` object. See the [main Uppy documentation](https://uppy.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the [Uppy website](https://uppy.io/docs/stores#ReduxStore).

## License

[The MIT License](./LICENSE).
