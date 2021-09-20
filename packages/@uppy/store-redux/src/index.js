const { nanoid } = require('nanoid')

// Redux action name.
const STATE_UPDATE = 'uppy/STATE_UPDATE'

// Pluck Uppy state from the Redux store in the default location.
const defaultSelector = (id) => (state) => state.uppy[id]

/**
 * Redux store.
 *
 * @param {object} opts.store - The Redux store to use.
 * @param {string} opts.id - This store instance's ID. Defaults to a random string.
 *    If you need to access Uppy state through Redux, eg. to render custom UI, set this to something constant.
 * @param {Function} opts.selector - Function, `(state) => uppyState`, to pluck state from the Redux store.
 *    Defaults to retrieving `state.uppy[opts.id]`. Override if you placed Uppy state elsewhere in the Redux store.
 */
class ReduxStore {
  static VERSION = require('../package.json').version

  #id

  #selector

  #store

  constructor (opts) {
    this.#store = opts.store
    this.#id = opts.id || nanoid()
    this.#selector = opts.selector || defaultSelector(this.#id)

    // Calling `setState` to dispatch an action to the Redux store.
    // The intent is to make sure that the reducer has run once.
    this.setState({})
  }

  setState (patch) {
    this.#store.dispatch({
      type: STATE_UPDATE,
      id: this.#id,
      payload: patch,
    })
  }

  getState () {
    return this.#selector(this.#store.getState())
  }

  subscribe (cb) {
    let prevState = this.getState()
    return this.#store.subscribe(() => {
      const nextState = this.getState()
      if (prevState !== nextState) {
        const patch = getPatch(prevState, nextState)
        cb(prevState, nextState, patch)
        prevState = nextState
      }
    })
  }

  [Symbol.for('uppy test: get id')] () {
    return this.#id
  }
}

function getPatch (prev, next) {
  const nextKeys = Object.keys(next)
  const patch = {}
  nextKeys.forEach((k) => {
    if (prev[k] !== next[k]) patch[k] = next[k]
  })
  return patch
}

function reducer (state = {}, action) {
  if (action.type === STATE_UPDATE) {
    const newState = { ...state[action.id], ...action.payload }
    return { ...state, [action.id]: newState }
  }
  return state
}

function middleware () {
  // Do nothing, at the moment.
  return () => (next) => (action) => {
    next(action)
  }
}

module.exports = ReduxStore
module.exports.ReduxStore = ReduxStore
module.exports.STATE_UPDATE = STATE_UPDATE
module.exports.reducer = reducer
module.exports.middleware = middleware
