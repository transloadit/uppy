import Plugin from './Plugin'

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

  setProgress (percentage) {
    this.progressBarContainerEl.classList.add('is-active')
    this.progressBarPercentageEl.innerHTML = `${percentage}%`
    this.progressBarInnerEl.setAttribute('style', `width: ${percentage}%`)
  }

  initProgressBar () {
    const caller = this
    this.target = this.getTarget(this.opts.target, caller)

    this.progressBarContainerEl = document.querySelector(this.target)
    this.progressBarContainerEl.innerHTML = `<div class="UppyProgressBar">
      <div class="UppyProgressBar-inner"></div>
      <div class="UppyProgressBar-percentage"></div>
    </div>`
    this.progressBarPercentageEl = document.querySelector(`${this.target} .UppyProgressBar-percentage`)
    this.progressBarInnerEl = document.querySelector(`${this.target} .UppyProgressBar-inner`)
  }

  initEvents () {
    this.core.emitter.on('progress', data => {
      const percentage = data.percentage
      const plugin = data.plugin
      this.core.log(
        `progress is: ${percentage}, set by ${plugin.constructor.name}`
      )
      this.setProgress(percentage)
    })
  }

  install () {
    this.initProgressBar()
    this.initEvents()
    return
  }
}
