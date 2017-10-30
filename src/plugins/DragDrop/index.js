const Plugin = require('./../Plugin')
const Translator = require('../../core/Translator')
const { toArray } = require('../../core/Utils')
const dragDrop = require('drag-drop')
// const html = require('yo-yo')

const { h } = require('picodom')
const hyperx = require('hyperx')
const html = hyperx(h)

/**
 * Drag & Drop plugin
 *
 */
module.exports = class DragDrop extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'acquirer'
    this.id = 'DragDrop'
    this.title = 'Drag & Drop'
    this.icon = html`
      <svg aria-hidden="true" class="UppyIcon" width="28" height="28" viewBox="0 0 16 16">
        <path d="M15.982 2.97c0-.02 0-.02-.018-.037 0-.017-.017-.035-.035-.053 0 0 0-.018-.02-.018-.017-.018-.034-.053-.052-.07L13.19.123c-.017-.017-.034-.035-.07-.053h-.018c-.018-.017-.035-.017-.053-.034h-.02c-.017 0-.034-.018-.052-.018h-6.31a.415.415 0 0 0-.446.426V11.11c0 .25.196.446.445.446h8.89A.44.44 0 0 0 16 11.11V3.023c-.018-.018-.018-.035-.018-.053zm-2.65-1.46l1.157 1.157h-1.157V1.51zm1.78 9.157h-8V.89h5.332v2.22c0 .25.196.446.445.446h2.22v7.11z"/>
        <path d="M9.778 12.89H4V2.666a.44.44 0 0 0-.444-.445.44.44 0 0 0-.445.445v10.666c0 .25.197.445.446.445h6.222a.44.44 0 0 0 .444-.445.44.44 0 0 0-.444-.444z"/>
        <path d="M.444 16h6.223a.44.44 0 0 0 .444-.444.44.44 0 0 0-.443-.445H.89V4.89a.44.44 0 0 0-.446-.446A.44.44 0 0 0 0 4.89v10.666c0 .248.196.444.444.444z"/>
      </svg>
    `

    const defaultLocale = {
      strings: {
        dropHereOr: 'Drop files here or',
        browse: 'browse'
        // selectedFiles: {
        //   0: '%{smart_count} file selected',
        //   1: '%{smart_count} files selected'
        // }
      }
    }

    // Default options
    const defaultOpts = {
      target: null,
      getMetaFromForm: true,
      width: '100%',
      height: '100%',
      note: '',
      locale: defaultLocale
    }

    // Merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOpts, opts)

        // Check for browser dragDrop support
    this.isDragDropSupported = this.checkDragDropSupport()

    this.locale = Object.assign({}, defaultLocale, this.opts.locale)
    this.locale.strings = Object.assign({}, defaultLocale.strings, this.opts.locale.strings)

    // i18n
    this.translator = new Translator({locale: this.locale})
    this.i18n = this.translator.translate.bind(this.translator)

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
    this.core.log('[DragDrop] Files dropped')

    files.forEach((file) => {
      this.core.addFile({
        source: this.id,
        name: file.name,
        type: file.type,
        data: file
      })
    })
  }

  handleInputChange (ev) {
    this.core.log('[DragDrop] Files selected through input')

    const files = toArray(ev.target.files)

    files.forEach((file) => {
      this.core.addFile({
        source: this.id,
        name: file.name,
        type: file.type,
        data: file
      })
    })
  }

  render (state) {
    const onSelect = (ev) => {
      const input = this.target.querySelector('.uppy-DragDrop-input')
      input.click()
    }

    // const selectedFilesCount = Object.keys(state.files).length

    return html`
      <div class="Uppy UppyTheme--default uppy-DragDrop-container ${this.isDragDropSupported ? 'is-dragdrop-supported' : ''}"
           style="width: ${this.opts.width}; height: ${this.opts.height};">
        <form class="uppy-DragDrop-inner" onsubmit=${(ev) => ev.preventDefault()}>
          <svg class="UppyIcon uppy-DragDrop-arrow" aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 10V0H5v10H2l6 6 6-6h-3zm0 0" fill-rule="evenodd"/>
          </svg>
          <input class="uppy-DragDrop-input uppy-DragDrop-focus"
                 type="file"
                 name="files[]"
                 multiple="true"
                 value=""
                 onchange=${this.handleInputChange.bind(this)} />
          <label class="uppy-DragDrop-label" onclick=${onSelect}>
            ${this.i18n('dropHereOr')}
            <span class="uppy-DragDrop-dragText">${this.i18n('browse')}</span>
          </label>
          <span class="uppy-DragDrop-note">${this.opts.note}</span>
        </form>
      </div>
    `
  }

  // ${selectedFilesCount > 0
  // ? html`<div class="uppy-DragDrop-selectedCount">
  //     ${this.i18n('selectedFiles', {'smart_count': selectedFilesCount})}
  //   </div>`
  // : ''}

  install () {
    const target = this.opts.target
    const plugin = this
    if (target) {
      this.mount(target, plugin)
    }
  }

  uninstall () {
    this.unmount()
  }

  mount (...args) {
    super.mount(...args)

    const dndContainer = this.target.querySelector('.uppy-DragDrop-container')
    this.removeDragDropListener = dragDrop(dndContainer, (files) => {
      this.handleDrop(files)
      this.core.log(files)
    })
  }

  unmount (...args) {
    this.removeDragDropListener()

    super.unmount(...args)
  }
}
