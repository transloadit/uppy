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

    // Keep track of number of selected files
    this.totalSelectedCount = 0
  }

  setProgress (percentage) {
    this.progressBarContainerEl.classList.add('is-active')
    this.progressBarPercentageEl.innerHTML = `${percentage}%`
    this.progressBarInnerEl.setAttribute('style', `width: ${percentage}%`)
  }

  init () {
    const caller = this
    this.target = this.getTarget(this.opts.target, caller)

    this.uploadButton = document.querySelector('.js-UppyModal-next')
    this.progressBarContainerEl = document.querySelector(this.target)
    this.progressBarContainerEl.innerHTML = `<div class="UppyProgressBar">
        <div class="UppyProgressBar-inner"></div>
        <div class="UppyProgressBar-percentage"></div>
      </div>`
    this.progressBarPercentageEl = document.querySelector(`${this.target} .UppyProgressBar-percentage`)
    this.progressBarInnerEl = document.querySelector(`${this.target} .UppyProgressBar-inner`)
  }

  events () {
    // When there is some progress (uploading), emit this event to adjust progressbar
    this.core.emitter.on('progress', data => {
      const percentage = data.percentage
      const plugin = data.plugin
      this.core.log(
        `progress is: ${percentage}, set by ${plugin.constructor.name}`
      )
      this.setProgress(percentage)
    })

    // When files are selected, fire this event to: display there names, progress...
    this.core.emitter.on('fileSelection', data => {
      const files = data.filesSelected

      // How many files have been selected now
      const selectedCount = files.length

        // How many files have been selected totally
      this.totalSelectedCount = this.totalSelectedCount + selectedCount

      this.uploadButton.innerHTML = this.core.i18n('uploadFiles', {'smart_count': this.totalSelectedCount})

      Object.keys(files).forEach(file => {
        this.core.log(`These file has been selected: ${files[file]}`)
      })
    })

    this.core.emitter.on('reset', data => {
      this.progressBarContainerEl.classList.remove('is-active')
      this.uploadButton.classList.remove('is-active')
      this.uploadButton.innerHTML = this.core.i18n('upload')
    })
  }

  install () {
    this.init()
    this.events()
    return
  }
}
