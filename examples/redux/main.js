const { createStore, compose, combineReducers, applyMiddleware } = require('redux')
const logger = require('redux-logger').default
const Uppy = require('uppy/lib/core')
const uppyReduxStore = require('uppy/lib/store/ReduxStore')
const Dashboard = require('uppy/lib/plugins/Dashboard')
const Tus = require('uppy/lib/plugins/Tus')

function counter (state = 0, action) {
  switch (action.type) {
    case 'INCREMENT':
      return state + 1
    case 'DECREMENT':
      return state - 1
    default:
      return state
  }
}

const reducer = combineReducers({
  counter: counter,
  // You don't have to use the `uppy` key. But if you don't,
  // you need to provide a custom `selector` to the `uppyReduxStore` call below.
  uppy: uppyReduxStore.reducer
})

let enhancer = applyMiddleware(
  uppyReduxStore.middleware(),
  logger
)
if (window.__REDUX_DEVTOOLS_EXTENSION__) {
  enhancer = compose(enhancer, window.__REDUX_DEVTOOLS_EXTENSION__())
}

const store = createStore(reducer, enhancer)

// Counter example from https://github.com/reactjs/redux/blob/master/examples/counter-vanilla/index.html
const valueEl = document.querySelector('#value')

function getCounter () { return store.getState().counter }
function render () {
  valueEl.innerHTML = getCounter().toString()
}
render()
store.subscribe(render)

document.querySelector('#increment').onclick = () => {
  store.dispatch({ type: 'INCREMENT' })
}
document.querySelector('#decrement').onclick = () => {
  store.dispatch({ type: 'DECREMENT' })
}
document.querySelector('#incrementIfOdd').onclick = () => {
  if (getCounter() % 2 !== 0) {
    store.dispatch({ type: 'INCREMENT' })
  }
}
document.querySelector('#incrementAsync').onclick = () => {
  setTimeout(() => store.dispatch({ type: 'INCREMENT' }), 1000)
}

// Uppy using the same store
const uppy = Uppy({
  autoProceed: false,
  id: 'redux',
  store: uppyReduxStore({ store: store }),
  // If we had placed our `reducer` elsewhere in Redux, eg. under an `uppy` key in the state for a profile page,
  // we'd do something like:
  //
  // store: uppyReduxStore({
  //   store: store,
  //   id: 'avatar',
  //   selector: state => state.pages.profile.uppy
  // }),
  debug: true
})
uppy.use(Dashboard, {
  target: '#app',
  inline: true,
  width: 400
})
uppy.use(Tus, { endpoint: 'https://master.tus.io/' })
uppy.run()

window.uppy = uppy
