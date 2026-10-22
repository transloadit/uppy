# Custom stores

If your app uses a state management library such as
[Redux](https://redux.js.org), it can be useful to have Uppy store its state
there instead. That way, you could write custom uploader UI components in the
same way as the other components in the application.

Uppy comes with one built-in state management solution (store):

- `@uppy/core/store-default`, a basic object-based store.

You can also use a third-party store:

- [uppy-store-ngrx](https://github.com/rimlin/uppy-store-ngrx/), keeping Uppy
  state in a key in an [Ngrx](https://github.com/ngrx/platform) store for use
  with Angular.

## Using stores

To use a store, pass an instance to the [`store` option](/docs/uppy/#store) in
the Uppy constructor:

```js
import DefaultStore from '@uppy/core/store-default';

const uppy = new Uppy({
	store: new DefaultStore(),
});
```

### `DefaultStore`

Uppy uses the `DefaultStore` by default! You do not need to do anything to use
it. It does not take any options.

## Implementing Stores

An Uppy store is an object with three methods.

- `getState()` - Return the current state object.
- `setState(patch)` - Merge the object `patch` into the current state.
- `subscribe(listener)` - Call `listener` whenever the state changes. `listener`
  is a function that should receive three parameters:
  `(prevState, nextState, patch)`

  The `subscribe()` method should return a function that “unsubscribes”
  (removes) the `listener`.

The default store implementation, for example, looks a bit like this:

```js
function createDefaultStore() {
	let state = {};
	const listeners = new Set();

	return {
		getState: () => state,
		setState: (patch) => {
			const prevState = state;
			const nextState = { ...prevState, ...patch };

			state = nextState;

			listeners.forEach((listener) => {
				listener(prevState, nextState, patch);
			});
		},
		subscribe: (listener) => {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
	};
}
```

A pattern like this, where users can pass options via a function call if
necessary, is recommended.

See the
[@uppy/core/store-default](https://github.com/transloadit/uppy/tree/main/packages/%40uppy/core/src/store)
source for more inspiration.
