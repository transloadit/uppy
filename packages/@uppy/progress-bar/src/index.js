const { Plugin } = require('@uppy/core')
const { h } = require('preact')

/**
 * Progress bar
 *
 */
module.exports = class ProgressBar extends Plugin {
  static VERSION = require('../package.json').version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'ProgressBar'
    this.title = 'Progress Bar'
    this.type = 'progressindicator'

    // set default options
    const defaultOptions = {
      target: 'body',
      replaceTargetContent: false,
      fixed: false,
      hideAfterFinish: true
    }

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.render = this.render.bind(this)
  }

  render (state) {
    const progress = state.totalProgress || 0
    // before starting and after finish should be hidden if specified in the options
    const isHidden = (progress === 0 || progress === 100) && this.opts.hideAfterFinish
    return (
      <div
        class="uppy uppy-ProgressBar"
        style={{ position: this.opts.fixed ? 'fixed' : 'initial' }}
        aria-hidden={isHidden}
      >
        <div class="uppy-ProgressBar-inner" style={{ width: progress + '%' }} />
        <div class="uppy-ProgressBar-percentage">{progress}</div>
      </div>
    )
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
