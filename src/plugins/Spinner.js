import Plugin from './Plugin'

/**
 * Spinner
 *
 */
export default class Spinner extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'progressindicator'

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)
  }

  setProgress (percentage) {
    if (percentage !== 100) {
      this.spinnerEl.classList.add('is-spinning')
    } else {
      this.spinnerEl.classList.remove('is-spinning')
    }
  }

  initSpinner () {
    const spinnerContainer = document.querySelector(this.target)
    spinnerContainer.innerHTML = '<div class="UppySpinner"></div>'
    this.spinnerEl = document.querySelector(`${this.target} .UppySpinner`)
  }

  initEvents () {
    this.core.emitter.on('upload-progress', (data) => {
      const percentage = data.percentage
      const plugin = data.plugin
      this.core.log(
        `progress is: ${percentage}, set by ${plugin.constructor.name}`
      )
      this.setProgress(percentage)
    })
  }

  install () {
    const caller = this
    this.target = this.getTarget(this.opts.target, caller)

    this.initSpinner()
    this.initEvents()
    return
  }
}
