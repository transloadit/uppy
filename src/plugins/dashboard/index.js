import Plugin from './../Plugin'
import html from 'yo-yo'
import dashboardIcon from './dashboard-icon.js'

/**
 * Dashboard — shows selected and uploaded files, as well as their progress,
 * lets you drag & drop files straight into it
 *
 */
export default class Dashboard extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.id = 'Dashboard'
    this.title = 'Dashboard'
    this.type = 'acquirer'

    this.icon = dashboardIcon

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.render = this.render.bind(this)
  }

  render (state) {
    return html`<div class="dashboard">123</div>`
  }

  install () {
    const target = this.opts.target
    const plugin = this
    this.target = this.mount(target, plugin)
  }
}
