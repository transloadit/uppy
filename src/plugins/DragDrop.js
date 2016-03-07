import Utils from '../core/Utils'
import Plugin from './Plugin'

/**
 * Drag & Drop plugin
 *
 */
export default class DragDrop extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'acquirer'
    this.name = 'Drag & Drop'
    this.icon = `
      <svg class="UppyModalTab-icon" width="28" height="28" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <path d="M15.982 2.97c0-.02 0-.02-.018-.037 0-.017-.017-.035-.035-.053 0 0 0-.018-.02-.018-.017-.018-.034-.053-.052-.07L13.19.123c-.017-.017-.034-.035-.07-.053h-.018c-.018-.017-.035-.017-.053-.034h-.02c-.017 0-.034-.018-.052-.018h-6.31a.415.415 0 0 0-.446.426V11.11c0 .25.196.446.445.446h8.89A.44.44 0 0 0 16 11.11V3.023c-.018-.018-.018-.035-.018-.053zm-2.65-1.46l1.157 1.157h-1.157V1.51zm1.78 9.157h-8V.89h5.332v2.22c0 .25.196.446.445.446h2.22v7.11z"/>
        <path d="M9.778 12.89H4V2.666a.44.44 0 0 0-.444-.445.44.44 0 0 0-.445.445v10.666c0 .25.197.445.446.445h6.222a.44.44 0 0 0 .444-.445.44.44 0 0 0-.444-.444z"/>
        <path d="M.444 16h6.223a.44.44 0 0 0 .444-.444.44.44 0 0 0-.443-.445H.89V4.89a.44.44 0 0 0-.446-.446A.44.44 0 0 0 0 4.89v10.666c0 .248.196.444.444.444z"/>
      </svg>
    `
    // Default options
    const defaultOptions = {
      target: '.UppyDragDrop'
    }

    // Merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    // Check for browser dragDrop support
    this.isDragDropSupported = this.checkDragDropSupport()

    // Bind `this` to class methods
    this.initEvents = this.initEvents.bind(this)
    this.handleDrop = this.handleDrop.bind(this)
    this.checkDragDropSupport = this.checkDragDropSupport.bind(this)
    this.handleInputChange = this.handleInputChange.bind(this)
  }

  render () {
    // Another way not to render next/upload button — if Modal is used as a target
    const target = this.opts.target.name
    return `
    <form class="UppyDragDrop-inner"
          method="post"
          enctype="multipart/form-data">
      <input class="UppyDragDrop-input"
             id="UppyDragDrop-input"
             type="file"
             name="files[]"
             multiple />
      <label class="UppyDragDrop-label" for="UppyDragDrop-input">
        <strong>${this.core.i18n('chooseFile')}</strong>
        <span class="UppyDragDrop-dragText">${this.core.i18n('orDragDrop')}</span>.
      </label>
      ${!this.core.opts.autoProceed && target !== 'Modal'
        ? `<button class="UppyDragDrop-uploadBtn UppyNextBtn" type="submit">${this.core.i18n('upload')}</button>`
        : ''}
    </form>`
  }

/**
 * Checks if the browser supports Drag & Drop,
 * not supported on mobile devices, for example.
 * @return {Boolean} true if supported, false otherwise
 */
  checkDragDropSupport () {
    const div = document.createElement('div')

    if (!('draggable' in div) || !('ondragstart' in div && 'ondrop' in div)) {
      return false
    }

    if (!('FormData' in window)) {
      return false
    }

    if (!('FileReader' in window)) {
      return false
    }

    return true
  }

  initEvents () {
    this.core.log(`waiting for some files to be dropped on ${this.target}`)

    // prevent default actions for all drag & drop events
    const strEvents = 'drag dragstart dragend dragover dragenter dragleave drop'
    Utils.addListenerMulti(this.dropzone, strEvents, (e) => {
      e.preventDefault()
      e.stopPropagation()
    })

    // Toggle is-dragover state when files are dragged over or dropped
    Utils.addListenerMulti(this.dropzone, 'dragover dragenter', (e) => {
      Utils.addClass(this.container, 'is-dragover')
    })

    Utils.addListenerMulti(this.dropzone, 'dragleave dragend drop', (e) => {
      Utils.removeClass(this.container, 'is-dragover')
    })

    const onDrop = new Promise((resolve, reject) => {
      this.dropzone.addEventListener('drop', (e) => {
        resolve(this.handleDrop.bind(null, e))
      })
    })

    const onInput = new Promise((resolve, reject) => {
      this.input.addEventListener('change', (e) => {
        resolve(this.handleInputChange.bind(null, e))
      })
    })

    // document.addEventListener('dragover', (e) => {
    //   console.log('ну пиздец')
    // })

    return Promise.race([onDrop, onInput]).then(handler => handler())
  }

  handleDrop (e) {
    this.core.log('all right, someone dropped something...')

    const files = e.dataTransfer.files
    return this.result(files)
  }

  handleInputChange () {
    this.core.log('all right, something selected through input...')

    const files = this.input.files
    return this.result(files)
  }

  result (files) {
    return new Promise((resolve, reject) => {
      const result = {from: 'DragDrop', files}

      // if autoProceed is false, wait for upload button to be pushed,
      // otherwise just pass files to uploaders right away
      if (this.core.opts.autoProceed) {
        return resolve(result)
      }

      this.core.emitter.on('next', () => {
        return resolve(result)
      })

      this.dropzone.addEventListener('submit', (e) => {
        e.preventDefault()
        return resolve(result)
      })
    })
  }

  install () {
    const caller = this
    this.target = this.getTarget(this.opts.target, caller)
    this.container = document.querySelector(this.target)
    this.container.innerHTML = this.render()

    // Set selectors
    this.dropzone = document.querySelector(`${this.target} .UppyDragDrop-inner`)
    this.input = document.querySelector(`${this.target} .UppyDragDrop-input`)

    Utils.addClass(this.container, 'UppyDragDrop')
    if (this.isDragDropSupported) {
      Utils.addClass(this.container, 'is-dragdrop-supported')
    }
  }

  run (results) {
    this.core.log({
      class: this.constructor.name,
      method: 'run',
      results: results
    })

    return this.initEvents()
  }
}
