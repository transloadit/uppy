const { Plugin } = require('@uppy/core')
const Translator = require('@uppy/utils/lib/Translator')
const toArray = require('@uppy/utils/lib/toArray')
const isDragDropSupported = require('@uppy/utils/lib/isDragDropSupported')
const getDroppedFiles = require('@uppy/utils/lib/getDroppedFiles')
const { h } = require('preact')

/**
 * Drag & Drop plugin
 *
 */
module.exports = class DragDrop extends Plugin {
  static VERSION = require('../package.json').version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'acquirer'
    this.id = this.opts.id || 'DragDrop'
    this.title = 'Drag & Drop'

    this.defaultLocale = {
      strings: {
        dropHereOr: 'Drop files here or %{browse}',
        browse: 'browse'
      }
    }

    // Default options
    const defaultOpts = {
      target: null,
      inputName: 'files[]',
      width: '100%',
      height: '100%',
      note: null
    }

    // Merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOpts, opts)

    // Check for browser dragDrop support
    this.isDragDropSupported = isDragDropSupported()
    this.removeDragOverClassTimeout = null

    // i18n
    this.translator = new Translator([ this.defaultLocale, this.uppy.locale, this.opts.locale ])
    this.i18n = this.translator.translate.bind(this.translator)
    this.i18nArray = this.translator.translateArray.bind(this.translator)

    // Bind `this` to class methods
    this.handleInputChange = this.handleInputChange.bind(this)
    this.handleDragOver = this.handleDragOver.bind(this)
    this.handleDragLeave = this.handleDragLeave.bind(this)
    this.handleDrop = this.handleDrop.bind(this)
    this.handlePaste = this.handlePaste.bind(this)
    this.addFile = this.addFile.bind(this)
    this.render = this.render.bind(this)
  }

  addFile (file) {
    try {
      this.uppy.addFile({
        source: this.id,
        name: file.name,
        type: file.type,
        data: file,
        meta: {
          relativePath: file.relativePath || null
        }
      })
    } catch (err) {
      // Nothing, restriction errors handled in Core
    }
  }

  handleInputChange (event) {
    this.uppy.log('[DragDrop] Files selected through input')
    const files = toArray(event.target.files)
    files.forEach(this.addFile)

    // We clear the input after a file is selected, because otherwise
    // change event is not fired in Chrome and Safari when a file
    // with the same name is selected.
    // ___Why not use value="" on <input/> instead?
    //    Because if we use that method of clearing the input,
    //    Chrome will not trigger change if we drop the same file twice (Issue #768).
    event.target.value = null
  }

  handlePaste (event) {
    this.uppy.log('[DragDrop] Files were pasted')
    const files = toArray(event.clipboardData.files)
    files.forEach(this.addFile)
  }

  handleDrop (event, dropCategory) {
    event.preventDefault()
    event.stopPropagation()
    clearTimeout(this.removeDragOverClassTimeout)
    // 1. Add a small (+) icon on drop
    event.dataTransfer.dropEffect = 'copy'

    // 2. Remove dragover class
    this.setPluginState({ isDraggingOver: false })

    // 3. Add all dropped files
    this.uppy.log('[DragDrop] File were dropped')
    getDroppedFiles(event.dataTransfer)
      .then((files) => {
        files.forEach(this.addFile)
      })
  }

  handleDragOver (event) {
    event.preventDefault()
    event.stopPropagation()

    clearTimeout(this.removeDragOverClassTimeout)
    this.setPluginState({ isDraggingOver: true })
  }

  handleDragLeave (event) {
    event.preventDefault()
    event.stopPropagation()

    clearTimeout(this.removeDragOverClassTimeout)
    // Timeout against flickering, this solution is taken from drag-drop library. Solution with 'pointer-events: none' didn't work across browsers.
    this.removeDragOverClassTimeout = setTimeout(() => {
      this.setPluginState({ isDraggingOver: false })
    }, 50)
  }

  render (state) {
    /* http://tympanus.net/codrops/2015/09/15/styling-customizing-file-inputs-smart-way/ */
    const hiddenInputStyle = {
      width: '0.1px',
      height: '0.1px',
      opacity: 0,
      overflow: 'hidden',
      position: 'absolute',
      zIndex: -1
    }

    const dragDropClass = `
      uppy-Root
      uppy-DragDrop-container
      ${this.isDragDropSupported ? 'uppy-DragDrop--is-dragdrop-supported' : ''}
      ${this.getPluginState().isDraggingOver ? 'uppy-DragDrop--isDraggingOver' : ''}
    `

    const dragDropStyle = {
      width: this.opts.width,
      height: this.opts.height
    }

    const restrictions = this.uppy.opts.restrictions

    // empty value="" on file input, so that the input is cleared after a file is selected,
    // because Uppy will be handling the upload and so we can select same file
    // after removing — otherwise browser thinks it’s already selected
    return (
      <div
        class={dragDropClass}
        style={dragDropStyle}
        onDragOver={this.handleDragOver}
        onDragLeave={this.handleDragLeave}
        onDrop={this.handleDrop}
        onPaste={this.handlePaste}>
        <div class="uppy-DragDrop-inner">
          <svg aria-hidden="true" class="UppyIcon uppy-DragDrop-arrow" width="16" height="16" viewBox="0 0 16 16">
            <path d="M11 10V0H5v10H2l6 6 6-6h-3zm0 0" fill-rule="evenodd" />
          </svg>
          <label class="uppy-DragDrop-label">
            <input style={hiddenInputStyle}
              class="uppy-DragDrop-input"
              type="file"
              name={this.opts.inputName}
              multiple={restrictions.maxNumberOfFiles !== 1}
              accept={restrictions.allowedFileTypes}
              onchange={this.handleInputChange} />
            {this.i18nArray('dropHereOr', {
              browse: <span class="uppy-DragDrop-dragText">{this.i18n('browse')}</span>
            })}
          </label>
          <span class="uppy-DragDrop-note">{this.opts.note}</span>
        </div>
      </div>
    )
  }

  install () {
    this.setPluginState({
      isDraggingOver: false
    })
    const target = this.opts.target
    if (target) {
      this.mount(target, this)
    }
  }

  uninstall () {
    this.unmount()
  }
}
