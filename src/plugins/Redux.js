const Plugin = require('../core/Plugin')

module.exports = class Redux extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'state-sync'
    this.id = 'Redux'
    this.title = 'Redux Emitter'

    if (typeof opts.action === 'undefined') {
      throw new Error('action option is not defined')
    }
    if (typeof opts.dispatch === 'undefined') {
      throw new Error('dispatch option is not defined')
    }
    this.opts = opts

    this.handleStateUpdate = this.handleStateUpdate.bind(this)
  }

  handleStateUpdate (prev, state, patch) {
    this.opts.dispatch(this.opts.action(prev, state, patch)) // this dispatches a redux event with the new state
  }

  install () {
    this.core.on('state-update', this.handleStateUpdate)
    this.handleStateUpdate({}, this.core.state, this.core.state) // set the initial redux state
  }

  uninstall () {
    this.core.off('state-update', this.handleStateUpdate)
  }
}
