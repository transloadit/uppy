import Plugin from './Plugin'
import yo from 'yo-yo'

/**
 * Progress bar
 *
 */
export default class ProgressBar extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'progressindicator'

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)
  }

  render (state) {
    const progress = state.totalProgress || 0

    return yo`<div class="UppyProgressBar">
      <div class="UppyProgressBar-inner" style="width: ${progress}%"></div>
      <div class="UppyProgressBar-percentage">${progress}</div>
    </div>`
  }

  install () {
    this.el = this.render(this.core.state)
    this.target = this.getTarget(this.opts.target, this, this.el, this.render.bind(this))
  }
}
