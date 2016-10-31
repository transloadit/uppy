import Plugin from './Plugin'
// import deepDiff from 'deep-diff'

/**
 * Persistent State
 *
 * Helps debug Uppy: loads saved state from localStorage, so when you restart the page,
 * your state is right where you left off. If something goes wrong, clear uppyState
 * in your localStorage, using the devTools
 *
 */
export default class PersistentState extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'debugger'
    this.id = 'Persistent State'
    this.title = 'PersistentState'

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)
  }

  loadSavedState () {
    const savedState = localStorage.getItem('uppyState')

    if (savedState) {
      this.core.state = JSON.parse(savedState)
    }
  }

  install () {
    this.loadSavedState()

    this.core.on('core:state-update', (prev, state, patch) => {
      localStorage.setItem('uppyState', JSON.stringify(state))
    })
  }
}
