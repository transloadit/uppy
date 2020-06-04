const cuid = require('cuid')

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

  constructor (opts) {
    this._store = opts.store
    this._id = opts.id || cuid()
    this._selector = opts.selector || defaultSelector(this._id)

    // Initialise the `uppy[id]` state key.
    this.setState({})
  }

  setState (patch) {
    this._store.dispatch({
      type: STATE_UPDATE,
      id: this._id,
      payload: patch
    })
  }

  getState () {
    return this._selector(this._store.getState())
  }

  subscribe (cb) {
    let prevState = this.getState()
    return this._store.subscribe(() => {
      const nextState = this.getState()
      if (prevState !== nextState) {
        const patch = getPatch(prevState, nextState)
        cb(prevState, nextState, patch)
        prevState = nextState
      }
    })
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
    const newState = Object.assign({}, state[action.id], action.payload)
    return Object.assign({}, state, {
      [action.id]: newState
    })
  }
  return state
}

function middleware () {
  // Do nothing, at the moment.
  return () => (next) => (action) => {
    next(action)
  }
}

module.exports = function createReduxStore (opts) {
  return new ReduxStore(opts)
}

module.exports.STATE_UPDATE = STATE_UPDATE
module.exports.reducer = reducer
module.exports.middleware = middleware
