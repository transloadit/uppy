import Plugin from './Plugin'

/**
 * Present
 *
 */
export default class Present extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'presenter'
    this.name = 'Present'

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)
  }

  render () {
    return `
      <div class="UppyPresenter"></div>
    `
  }

  run () {
    const presenter = document.querySelector('.UppyPresenter')
    presenter.innerHTML = `<p>Files have been uploaded, would you like to close the Modal
      or upload something else?</p>`
  }

  install () {
    const caller = this
    this.target = this.getTarget(this.opts.target, caller)
    this.targetEl = document.querySelector(this.target)
    this.targetEl.innerHTML = this.render()
    return
  }
}
