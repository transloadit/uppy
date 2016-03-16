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
    const defaultOptions = {
      target: '.UppyPresenter-container'
    }

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)
  }

  render () {
    return `
      <div class="UppyPresenter"></div>
    `
  }

  hidePresenter () {
    this.presenter.classList.remove('is-visible')
  }

  showPresenter (target, uploadedCount) {
    this.presenter.classList.add('is-visible')
    this.presenter.innerHTML = `
      <p>You have successfully uploaded
        <strong>${this.core.i18n('files', {'smart_count': uploadedCount})}</strong>
      </p>
      ${target === 'Modal'
        ? `<button class="UppyPresenter-modalClose js-UppyModal-close" type="button">${this.core.i18n('closeModal')}</button>`
        : ''}
    `
  }

  initEvents () {
    this.core.emitter.on('reset', data => {
      this.hidePresenter()
    })
  }

  run (results) {
    // Emit allDone event so that, for example, Modal can hide all tabs
    this.core.emitter.emit('allDone')

    const uploadedCount = results[0].uploadedCount
    const target = this.opts.target.name
    this.showPresenter(target, uploadedCount)
  }

  install () {
    const caller = this
    this.target = this.getTarget(this.opts.target, caller)
    this.targetEl = document.querySelector(this.target)
    this.targetEl.innerHTML = this.render()
    this.initEvents()
    this.presenter = document.querySelector('.UppyPresenter')

    return
  }
}
