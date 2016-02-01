import Utils from '../core/Utils'
import Plugin from './Plugin'
import componentDragDrop from '../components/dragdrop.js'

/**
 * Drag & Drop plugin
 *
 */
export default class DragDrop extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'selecter'

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    // check if dragDrop is supported in the browser
    this.isDragDropSupported = this.checkDragDropSupport()

    // initialize dragdrop component, mount it to container DOM node
    this.initHtml()

    // bind `this` to class methods
    this.listenForEvents = this.listenForEvents.bind(this)
    this.handleDrop = this.handleDrop.bind(this)
    this.checkDragDropSupport = this.checkDragDropSupport.bind(this)
    this.handleInputChange = this.handleInputChange.bind(this)
  }

  initHtml () {
    this.container = document.querySelector(this.opts.target)

    this.container.innerHTML = componentDragDrop({
      endpoint: this.opts.endpoint,
      chooseFile: this.core.i18n('chooseFile'),
      orDragDrop: this.core.i18n('orDragDrop'),
      showUploadBtn: this.core.opts.autoProceed,
      upload: this.core.i18n('upload')
    })

    // Set selectors
    this.dropzone = document.querySelector(`${this.opts.target} .UppyDragDrop-inner`)
    this.input = document.querySelector(`${this.opts.target} .UppyDragDrop-input`)
    this.status = document.querySelector(`${this.opts.target} .UppyDragDrop-status`)
    this.progress = document.querySelector(`${this.opts.target} .UppyDragDrop-progress`)

    Utils.addClass(this.container, 'UppyDragDrop')
    if (this.isDragDropSupported) {
      Utils.addClass(this.container, 'is-dragdrop-supported')
    }

    // this.progress = document.querySelector(`${this.opts.target} .UppyDragDrop-progressInner`)
    // this.progress.setAttribute('style', 'width: 60%')
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

  listenForEvents () {
    this.core.log(`waiting for some files to be dropped on ${this.opts.target}`)
    // console.log(`waiting for some files to be dropped on ${this.opts.target}`)

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

    this.container.addEventListener('progress', (e) => {
      const percentage = e.detail
      this.setProgress(percentage)
    })

    return Promise.race([onDrop, onInput]).then(handler => handler())
  }

  displayStatus (status) {
    this.status.innerHTML = status
  }

  handleDrop (e) {
    console.log('all right, someone dropped something...')

    const files = e.dataTransfer.files
    return this.result(files)
  }

  handleInputChange () {
    console.log('all right, something selected through input...')

    const files = this.input.files
    return this.result(files)

    // return Promise.resolve({from: 'DragDrop', files, formData})
  }

  result (files) {
    return new Promise((resolve, reject) => {
      const result = {from: 'DragDrop', files}
      // if autoProceed is false, wait for upload button to be pushed,
      // otherwise just pass files to uploaders right away
      if (this.core.opts.autoProceed) {
        return resolve(result)
      } else {
        this.dropzone.addEventListener('submit', (e) => {
          e.preventDefault()
          return resolve(result)
        })
      }
    })
  }

  run (results) {
    console.log({
      class: 'DragDrop',
      method: 'run',
      results: results
    })

    return this.listenForEvents()
  }
}
