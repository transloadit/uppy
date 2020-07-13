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
    this.opts = { ...defaultOpts, ...opts }

    // Check for browser dragDrop support
    this.isDragDropSupported = isDragDropSupported()
    this.removeDragOverClassTimeout = null

    this.i18nInit()

    // Bind `this` to class methods
    this.onInputChange = this.onInputChange.bind(this)
    this.handleDragOver = this.handleDragOver.bind(this)
    this.handleDragLeave = this.handleDragLeave.bind(this)
    this.handleDrop = this.handleDrop.bind(this)
    this.addFiles = this.addFiles.bind(this)
    this.render = this.render.bind(this)
  }

  setOptions (newOpts) {
    super.setOptions(newOpts)
    this.i18nInit()
  }

  i18nInit () {
    this.translator = new Translator([this.defaultLocale, this.uppy.locale, this.opts.locale])
    this.i18n = this.translator.translate.bind(this.translator)
    this.i18nArray = this.translator.translateArray.bind(this.translator)
    this.setPluginState() // so that UI re-renders and we see the updated locale
  }

  addFiles (files) {
    const descriptors = files.map((file) => ({
      source: this.id,
      name: file.name,
      type: file.type,
      data: file,
      meta: {
        // path of the file relative to the ancestor directory the user selected.
        // e.g. 'docs/Old Prague/airbnb.pdf'
        relativePath: file.relativePath || null
      }
    }))

    try {
      this.uppy.addFiles(descriptors)
    } catch (err) {
      this.uppy.log(err)
    }
  }

  onInputChange (event) {
    this.uppy.log('[DragDrop] Files selected through input')
    const files = toArray(event.target.files)
    this.addFiles(files)

    // We clear the input after a file is selected, because otherwise
    // change event is not fired in Chrome and Safari when a file
    // with the same name is selected.
    // ___Why not use value="" on <input/> instead?
    //    Because if we use that method of clearing the input,
    //    Chrome will not trigger change if we drop the same file twice (Issue #768).
    event.target.value = null
  }

  handleDrop (event, dropCategory) {
    event.preventDefault()
    event.stopPropagation()
    clearTimeout(this.removeDragOverClassTimeout)

    // 2. Remove dragover class
    this.setPluginState({ isDraggingOver: false })

    // 3. Add all dropped files
    this.uppy.log('[DragDrop] Files were dropped')
    const logDropError = (error) => {
      this.uppy.log(error, 'error')
    }
    getDroppedFiles(event.dataTransfer, { logDropError })
      .then((files) => this.addFiles(files))
  }

  handleDragOver (event) {
    event.preventDefault()
    event.stopPropagation()

    // 1. Add a small (+) icon on drop
    // (and prevent browsers from interpreting this as files being _moved_ into the browser, https://github.com/transloadit/uppy/issues/1978)
    event.dataTransfer.dropEffect = 'copy'

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

  renderHiddenFileInput () {
    const restrictions = this.uppy.opts.restrictions
    return (
      <input
        class="uppy-DragDrop-input"
        type="file"
        hidden
        ref={(ref) => { this.fileInputRef = ref }}
        name={this.opts.inputName}
        multiple={restrictions.maxNumberOfFiles !== 1}
        accept={restrictions.allowedFileTypes}
        onchange={this.onInputChange}
      />
    )
  }

  renderArrowSvg () {
    return (
      <svg aria-hidden="true" focusable="false" class="uppy-c-icon uppy-DragDrop-arrow" width="16" height="16" viewBox="0 0 16 16">
        <path d="M11 10V0H5v10H2l6 6 6-6h-3zm0 0" fill-rule="evenodd" />
      </svg>
    )
  }

  renderLabel () {
    return (
      <div class="uppy-DragDrop-label">
        {this.i18nArray('dropHereOr', {
          browse: <span class="uppy-DragDrop-browse">{this.i18n('browse')}</span>
        })}
      </div>
    )
  }

  renderNote () {
    return (
      <span class="uppy-DragDrop-note">{this.opts.note}</span>
    )
  }

  render (state) {
    const dragDropClass = `uppy-Root
      uppy-u-reset
      uppy-DragDrop-container
      ${this.isDragDropSupported ? 'uppy-DragDrop--isDragDropSupported' : ''}
      ${this.getPluginState().isDraggingOver ? 'uppy-DragDrop--isDraggingOver' : ''}
    `

    const dragDropStyle = {
      width: this.opts.width,
      height: this.opts.height
    }

    return (
      <button
        type="button"
        class={dragDropClass}
        style={dragDropStyle}
        onClick={() => this.fileInputRef.click()}
        onDragOver={this.handleDragOver}
        onDragLeave={this.handleDragLeave}
        onDrop={this.handleDrop}
      >
        {this.renderHiddenFileInput()}
        <div class="uppy-DragDrop-inner">
          {this.renderArrowSvg()}
          {this.renderLabel()}
          {this.renderNote()}
        </div>
      </button>
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
