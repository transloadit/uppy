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

  update (state) {
    const newEl = this.render(state)
    yo.update(this.el, newEl)
  }

  render () {
    const progress = this.core.getState().totalProgress

    return yo`<div class="UppyProgressBar">
      <div class="UppyProgressBar-inner" style="width: ${progress}%"></div>
      <div class="UppyProgressBar-percentage">${progress}</div>
    </div>`
  }

  install () {
    const caller = this
    this.el = this.render(this.core.state)
    this.target = this.getTarget(this.opts.target, caller, this.el)
  }
}
