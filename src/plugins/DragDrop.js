import Plugin from './Plugin'
import Utils from '../core/Utils'
import dragDrop from 'drag-drop'
import yo from 'yo-yo'

/**
 * Drag & Drop plugin
 *
 */
export default class DragDrop extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'acquirer'
    this.id = 'DragDrop'
    this.title = 'Drag & Drop'
    this.icon = yo`
      <svg class="UppyIcon UppyModalTab-icon" width="28" height="28" viewBox="0 0 16 16">
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
    this.handleDrop = this.handleDrop.bind(this)
    this.checkDragDropSupport = this.checkDragDropSupport.bind(this)
    this.handleInputChange = this.handleInputChange.bind(this)
    this.render = this.render.bind(this)
  }

/**
 * Checks if the browser supports Drag & Drop (not supported on mobile devices, for example).
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

  handleDrop (files) {
    this.core.log('All right, someone dropped something...')

    // this.core.emitter.emit('file-add', {
    //   plugin: this,
    //   acquiredFiles: files
    // })

    files.forEach((file) => {
      this.core.emitter.emit('file-add', {
        source: this.id,
        name: file.name,
        type: file.type,
        data: file
      })
    })

    this.core.addMeta({bla: 'bla'})
  }

  handleInputChange (ev) {
    this.core.log('All right, something selected through input...')

    const files = Utils.toArray(ev.target.files)

    files.forEach((file) => {
      console.log(file)
      this.core.emitter.emit('file-add', {
        source: this.id,
        name: file.name,
        type: file.type,
        data: file
      })
    })
  }

  focus () {
    const firstInput = document.querySelector(`${this.target} .UppyDragDrop-focus`)

    // only works for the first time if wrapped in setTimeout for some reason
    // firstInput.focus()
    setTimeout(function () {
      firstInput.focus()
    }, 10)
  }

  render (state) {
    // Another way not to render next/upload button — if Modal is used as a target
    const target = this.opts.target.name

    const onSelect = (ev) => {
      const input = document.querySelector(`${this.target} .UppyDragDrop-input`)
      input.click()
    }

    const next = (ev) => {
      ev.preventDefault()
      ev.stopPropagation()
      this.core.emitter.emit('next')
    }

    const onSubmit = (ev) => {
      ev.preventDefault()
    }

    return yo`
      <div class="UppyDragDrop-container ${this.isDragDropSupported ? 'is-dragdrop-supported' : ''}">
        <form class="UppyDragDrop-inner"
              onsubmit=${onSubmit}>
          <input class="UppyDragDrop-input UppyDragDrop-focus"
                 type="file"
                 name="files[]"
                 multiple="true"
                 value=""
                 onchange=${this.handleInputChange.bind(this)} />
          <label class="UppyDragDrop-label" onclick=${onSelect}>
            <strong>${this.core.i18n('chooseFile')}</strong>
            <span class="UppyDragDrop-dragText">${this.core.i18n('orDragDrop')}</span>
          </label>
          ${!this.core.opts.autoProceed && target !== 'Modal'
            ? yo`<button class="UppyDragDrop-uploadBtn UppyNextBtn"
                         type="submit"
                         onclick=${next}>
                    ${this.core.i18n('upload')}
              </button>`
            : ''}
        </form>
      </div>
    `
  }

  install () {
    const target = this.opts.target
    const plugin = this
    this.target = this.mount(target, plugin)

    dragDrop(`${this.target} .UppyDragDrop-container`, (files) => {
      this.handleDrop(files)
      this.core.log(files)
    })
  }
}
