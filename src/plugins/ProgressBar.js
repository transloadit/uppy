const Plugin = require('../core/Plugin')
const { h } = require('preact')

/**
 * Progress bar
 *
 */
module.exports = class ProgressBar extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'ProgressBar'
    this.title = 'Progress Bar'
    this.type = 'progressindicator'

    // set default options
    const defaultOptions = {
      target: 'body',
      replaceTargetContent: false,
      fixed: false
    }

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.render = this.render.bind(this)
  }

  render (state) {
    const progress = state.totalProgress || 0

    return <div class="uppy uppy-ProgressBar" style={{ position: this.opts.fixed ? 'fixed' : 'initial' }}>
      <div class="uppy-ProgressBar-inner" style={{ width: progress + '%' }} />
      <div class="uppy-ProgressBar-percentage">{progress}</div>
    </div>
  }

  install () {
    const target = this.opts.target
    if (target) {
      this.mount(target, this)
    }
  }

  uninstall () {
    this.unmount()
  }
}
