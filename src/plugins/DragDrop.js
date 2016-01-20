import Utils from '../core/Utils'
import Plugin from './Plugin'

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
      bla       : 'blabla',
      autoSubmit: true,
      modal     : true
    }

    // merge default options with the ones set by user
    this.opts = defaultOptions
    Object.assign(this.opts, opts)

    // get the element where the Drag & Drop event will occur
    this.dropzone = document.querySelectorAll(this.opts.selector)[0]
    this.dropzoneInput = document.querySelectorAll('.UppyDragDrop-input')[0]

    this.status = document.querySelectorAll('.UppyDragDrop-status')[0]

    this.isDragDropSupported = this.checkDragDropSupport()

    // crazy stuff so that ‘this’ will behave in class
    this.listenForEvents = this.listenForEvents.bind(this)
    this.handleDrop = this.handleDrop.bind(this)
    this.checkDragDropSupport = this.checkDragDropSupport.bind(this)
    this.handleInputChange = this.handleInputChange.bind(this)
  }

   /**
  * Checks if the browser supports Drag & Drop
  * @return {object} true if supported, false otherwise
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
    console.log(`waiting for some files to be dropped on ${this.opts.selector}`)

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

    // this.dropzone.addEventListener('drop', this.handleDrop);
    // this.dropzoneInput.addEventListener('change', this.handleInputChange);
  }

  displayStatus (status) {
    this.status.innerHTML = status
  }

  handleDrop (e) {
    console.log('all right, someone dropped something here...')
    const files = e.dataTransfer.files
    // files = Array.from(files);

    // const formData = new FormData(this.dropzone);
    // console.log('pizza', formData);

    // for (var i = 0; i < files.length; i++) {
    //   formData.append('file', files[i]);
    //   console.log('pizza', files[i]);
    // }

    return Promise.resolve({from: 'DragDrop', files: files})
  }

  handleInputChange () {
    // const fileInput = document.querySelectorAll('.UppyDragDrop-input')[0];
    const formData = new FormData(this.dropzone)

    console.log('@todo: No support for formData yet', formData)
    const files = []

    return Promise.resolve({from: 'DragDrop', files: files})
  }

  run (results) {
    console.log({
      class  : 'DragDrop',
      method : 'run',
      results: results
    })

    return this.listenForEvents()
  }
}
