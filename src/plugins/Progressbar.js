import Utils from '../core/Utils'
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
    const progressBarElement = document.querySelector('.UppyDragDrop-progressInner')
    progressBarElement.setAttribute('style', `width: ${percentage}%`)
  }

  spinner () {
    Utils.addClass(this.spinnerElement, 'is-spinning')
  }

  initEvents () {
    this.core.emitter.on('progress', data => {
      const percentage = data.percentage
      const plugin = data.plugin
      console.log(`this is what the progress is: ${percentage}, and its set by ${plugin}`)
      this.progressBar(percentage)
    })
  }

  // run (results) {
  //   console.log({
  //     class: 'Progress',
  //     method: 'run',
  //     results: results
  //   })
  //
  //   this.initEvents()
  //
  //   return Promise.resolve(results)
  // }

  install() {
    return this.initEvents()
  }
}
