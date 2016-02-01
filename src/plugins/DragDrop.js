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
    const defaultOptions = {
      autoSubmit: true
    }

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.isDragDropSupported = this.checkDragDropSupport()
    this.initHtml()

    // crazy stuff so that ‘this’ will behave in class
    this.listenForEvents = this.listenForEvents.bind(this)
    this.handleDrop = this.handleDrop.bind(this)
    this.checkDragDropSupport = this.checkDragDropSupport.bind(this)
    this.handleInputChange = this.handleInputChange.bind(this)
  }

  initHtml () {
    this.dragDropContainer = document.querySelector('.UppyDragDrop')

    this.dragDropContainer.innerHTML = componentDragDrop({
      endpoint: this.opts.endpoint,
      chooseFile: this.core.i18n('chooseFile'),
      orDragDrop: this.core.i18n('orDragDrop'),
      showUploadBtn: this.opts.autoSubmit,
      upload: this.core.i18n('upload')
    })

    // get the element where the Drag & Drop event will occur
    this.dropzone = document.querySelector(this.opts.target)
    this.dropzoneInput = document.querySelector('.UppyDragDrop-input')

    this.status = document.querySelector('.UppyDragDrop-status')
  }

/**
 * Checks if the browser supports Drag & Drop
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
    console.log(`waiting for some files to be dropped on ${this.opts.target}`)

    if (this.isDragDropSupported) {
      Utils.addClass(this.dropzone, 'is-dragdrop-supported')
    }

    // prevent default actions for all drag & drop events
    const strEvents = 'drag dragstart dragend dragover dragenter dragleave drop'
    Utils.addListenerMulti(this.dropzone, strEvents, (e) => {
      e.preventDefault()
      e.stopPropagation()
    })

    // Toggle is-dragover state when files are dragged over or dropped
    Utils.addListenerMulti(this.dropzone, 'dragover dragenter', (e) => {
      Utils.addClass(this.dropzone, 'is-dragover')
    })

    Utils.addListenerMulti(this.dropzone, 'dragleave dragend drop', (e) => {
      Utils.removeClass(this.dropzone, 'is-dragover')
    })

    const onDrop = new Promise((resolve, reject) => {
      this.dropzone.addEventListener('drop', (e) => {
        resolve(this.handleDrop.bind(null, e))
      })
    })

    const onInput = new Promise((resolve, reject) => {
      this.dropzoneInput.addEventListener('change', (e) => {
        resolve(this.handleInputChange.bind(null, e))
      })
    })

    return Promise.race([onDrop, onInput]).then(handler => handler())
  }

  displayStatus (status) {
    this.status.innerHTML = status
  }

  handleDrop (e) {
    console.log('all right, someone dropped something...')
    const files = e.dataTransfer.files
    // const arrayOfFiles = Array.from(files)

    const formData = new FormData(this.dropzone)

    Array.from(files).forEach((file, i) => {
      console.log(`file-${i}`)
      formData.append(`file-${i}`, file)
    })

    return this.result(files, formData)
  }

  handleInputChange () {
    console.log('all right, something selected through input...')
    const files = this.dropzoneInput.files
    const formData = new FormData(this.dropzone)

    return this.result(files, formData)

    // return Promise.resolve({from: 'DragDrop', files, formData})
  }

  result (files, formData) {
    return new Promise((resolve, reject) => {
      // if autoSubmit is false, wait for upload button to be pushed,
      // otherwise just pass files to uploaders right away
      if (!this.opts.autoSubmit) {
        this.dropzone.addEventListener('submit', (e) => {
          e.preventDefault()
          console.log('yo!')
          return resolve({from: 'DragDrop', files, formData})
        })
      } else {
        return resolve({from: 'DragDrop', files, formData})
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
