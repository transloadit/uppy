---
type: docs
order: 4
title: "Custom Stores"
permalink: docs/stores/
---

<link rel="stylesheet" href="https://uppy.io/css/main.css">

By default, Uppy stores its internal state in an object.
If your app uses a state management library such as [Redux](https://redux.js.org), it can be useful to have Uppy store its state there instead—that way, you could write custom uploader UI components in the same way as the other components in the application.

Uppy comes with two state management solutions (stores):

 - `DefaultStore`, a simple object-based store.
 - `ReduxStore`, a store that uses a key in a Redux store.

## Using Stores

To use a store, pass an instance to the [`store` option](/docs/uppy#store-defaultstore) in the Uppy constructor:

```js
const defaultStore = require('uppy/lib/store/DefaultStore')

const uppy = Uppy({
  store: defaultStore()
})
```

## Implementing Stores

An Uppy store is an object with three methods.

 - `getState()` - Return the current state object.
 - `setState(patch)` - Merge the object `patch` into the current state.
 - `subscribe(listener)` - Call `listener` whenever the state changes.
   `listener` is a function that should receive three parameters:
   `(prevState, nextState, patch)`

   The `subscribe()` method should return a function that 'unsubscribes' (removes) the `listener`.

The default store implementation, for example, looks a bit like this:

```js
function defaultStore () {
  let state = {}
  const listeners = new Set()

  return {
    getState: () => state,
    setState: (patch) => {
      const prevState = state
      const nextState = Object.assign({}, prevState, patch)

      state = nextState

      listeners.forEach((listener) => {
        listener(prevState, nextState, patch)
      })
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.remove(listener)
    }
  }
}
```

A pattern like this, where users can pass options via a function call if necessary, is recommended.

See the [./src/store](https://github.com/transloadit/uppy/tree/feature/store/src/store) folder in the repository for more inspiration.
