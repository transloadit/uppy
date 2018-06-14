const Plugin = require('@uppy/core/lib/Plugin')
// import deepDiff from 'deep-diff'

/**
 * Magic Log
 * Helps debug Uppy
 * inspired by https://github.com/yoshuawuyts/choo-log
 *
 */
module.exports = class MagicLog extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'debugger'
    this.id = 'MagicLog'
    this.title = 'Magic Log'

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.handleStateUpdate = this.handleStateUpdate.bind(this)
  }

  handleStateUpdate (prev, state, patch) {
    console.group('State')
    console.log('Prev', prev)
    console.log('Next', state)
    console.log('Patch', patch)
    console.groupEnd()
  }

  install () {
    this.uppy.on('state-update', this.handleStateUpdate)
  }

  uninstall () {
    this.uppy.off('state-update', this.handleStateUpdate)
  }
}
