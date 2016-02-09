import Plugin from './Plugin'

/**
 * Progress bar
 *
 */
export default class Progress extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'progress'

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.progressBarElement = document.querySelector('.UppyDragDrop-progressInner')
  }

  progressBar (percentage) {
    const progressContainer = document.querySelector(this.opts.target)
    progressContainer.innerHTML = '<div class="UppyProgressBar"></div>'
    const progressBarElement = document.querySelector(`${this.opts.target} .UppyProgressBar`)
    progressBarElement.setAttribute('style', `width: ${percentage}%`)
  }

  initEvents () {
    this.core.emitter.on('progress', data => {
      const percentage = data.percentage
      const plugin = data.plugin
      this.core.log(
        `this is what the progress is: ${percentage}, and its set by ${plugin.constructor.name}`
      )
      this.progressBar(percentage)
    })
  }

  install () {
    return this.initEvents()
  }
}
