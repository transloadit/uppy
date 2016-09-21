import { createStore, combineReducers } from 'redux'

export default class Core {
  constructor (opts) {
    this.opts = opts
  }

  parseFiles (files) {
    // parse file or files
  }

  use (Plugin, opts) {
    const plugin = new Plugin(opts)

    // ... is same thing as using Object.assign
    this.reducers = combineReducers({
      [plugin.id]: plugin.reducer,
      ...this.reducers
    })
  }

  init () {
    this.store = createStore(this.reducers)
    this.dispatch = this.store.dispatch
  }
}
