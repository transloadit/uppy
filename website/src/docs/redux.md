---
title: "Redux"
type: docs
permalink: docs/redux
order: 57
---

Uppy supports popular [Redux](https://redux.js.org/) state management library in two ways:

## Redux Store

You can tell Uppy to use your app’s Redux store for its files and UI state. Please checkout [Custom Stores](/docs/stores/) for more info on that. Here’s an example to give you a sense of how this works:

```js
const { createStore } = require('redux')
const ReduxStore = require('uppy/lib/store/ReduxStore')

const reducer = combineReducers({
  ...reducers,
  uppy: ReduxStore.reducer
})

const uppy = Uppy({
  store: ReduxStore({
    store: createStore(reducer) // That's a lot of stores!
  })
})
```

## Redux Dev Tools

`ReduxDevTools` plugin that simply syncs with [redux-devtools](https://github.com/gaearon/redux-devtools) browser or JS extensions, and allows for basic time travel:

```js
const Uppy = require('uppy/lib/core')
const ReduxDevTools = require('uppy/lib/plugins/ReduxDevTools')

const uppy = Uppy({
  debug: true,
  autoProceed: false,
  meta: {
    username: 'John',
    license: 'Creative Commons'
  }
})
  .use(XHRUpload, { endpoint: 'https://example.com' })
  .use(ReduxDevTools)
```

After you `.use(ReduxDevTools)`, you should be able to see Uppy’s state in Redux Dev Tools.

You likely don’t need this if you are actually using Redux yourself and Redux Store in Uppy from above, since it will just work.
