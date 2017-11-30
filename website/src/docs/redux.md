---
title: "Redux"
type: docs
permalink: docs/react/redux-sync/
order: 57
---

The `Redux` plugin syncs a Redux store with Uppy's internal state. This simplifies writing custom UIs for Uppy in applications that use Redux.

To use it, define a Redux action and reducer:

```js
// The action creator receives 3 parameters:
// - The previous state
// - The new state
// - The change set
const uppyStateUpdate = (previous, next, patch) => ({
  type: 'UPPY_STATE_UPDATE',
  previous,
  next,
  patch
})

function reduce (state = {}, action) {
  if (action.type === 'UPPY_STATE_UPDATE') {
    return {
      ...state,
      // Merge in the changes.
      ...action.patch
    }
  }
}
```

Then pass your Redux store's `dispatch` function and the action creator to the Redux plugin:

```js
const ReduxStore = require('uppy/lib/Redux')
uppy.use(ReduxStore, {
  dispatch: store.dispatch,
  action: uppyStateUpdate
})
```

## Options

### `dispatch`

The dispatch function for a Redux store.

### `action`

An action creator for uppy state updates.

The action creator receives 3 parameters:

1. The previous state
1. The new state
1. The change set: an object that can be merged into the previous state to produce the new state.
