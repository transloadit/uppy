const Plugin = require('../core/Plugin')
const { h } = require('preact')
const hyperx = require('hyperx')
const html = hyperx(h)

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

    return html`<div class="UppyProgressBar" style="${this.opts.fixed ? 'position: fixed' : 'null'}">
      <div class="UppyProgressBar-inner" style="width: ${progress}%"></div>
      <div class="UppyProgressBar-percentage">${progress}</div>
    </div>`
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
