const Plugin = require('./Plugin')

export default class Redux extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'redux'
    this.id = 'Redux'
    this.title = 'Redux Emitter'

    // set default options
    const defaultOptions = {
      action: () => {},
      dispatch: () => {}
    }

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.handleStateUpdate = this.handleStateUpdate.bind(this)
  }

  handleStateUpdate (prev, state, patch) {
    this.opts.dispatch(this.opts.action(prev, state, patch)) // this dispatches a redux event with the new state
  }

  install () {
    this.core.emitter.on('core:state-update', this.handleStateUpdate)
    this.opts.dispatch(this.opts.action({}, this.core.state, this.core.state)) // set the initial redux state
  }

  uninstall () {
    this.core.emitter.off('state-update', this.handleStateUpdate)
  }
}
