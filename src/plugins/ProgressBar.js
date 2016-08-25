import Plugin from './Plugin'
import html from '../core/html'

/**
 * Progress bar
 *
 */
export default class ProgressBar extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.id = 'ProgressBar'
    this.title = 'Progress Bar'
    this.type = 'progressindicator'

    // set default options
    const defaultOptions = {
      replaceTargetContent: false
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
    const plugin = this
    this.target = this.mount(target, plugin)
  }
}
