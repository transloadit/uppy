import Plugin from './Plugin'
// import deepDiff from 'deep-diff'

/**
 * Magic Log
 * Helps debug Uppy
 * inspired by https://github.com/yoshuawuyts/choo-log
 *
 */
export default class MagicLog extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'progressindicator'
    this.id = 'MagicLog'
    this.title = 'Magic Log'

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)
  }

  install () {
    const uppy = this.core.emitter
    uppy.on('state-update', (prev, state, patch) => {
      console.group('State')
      console.log('Prev', prev)
      console.log('Next', state)
      console.log('Patch', patch)
      console.groupEnd()
    })
  }
}
