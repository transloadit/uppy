const Plugin = require('../../core/Plugin')
const Translator = require('../../core/Translator')
const { toArray } = require('../../core/Utils')
const dragDrop = require('drag-drop')
const preact = require('preact') // eslint-disable-line

/**
 * Drag & Drop plugin
 *
 */
module.exports = class DragDrop extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'acquirer'
    this.id = this.opts.id || 'DragDrop'
    this.title = 'Drag & Drop'

    const defaultLocale = {
      strings: {
        dropHereOr: 'Drop files here or',
        browse: 'browse'
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
    this.onBrowseClick = this.onBrowseClick.bind(this)
    this.onInputChange = this.onInputChange.bind(this)
    this.checkDragDropSupport = this.checkDragDropSupport.bind(this)
    this.render = this.render.bind(this)
  }

  /**
   * Checks if the browser supports Drag & Drop (not supported on mobile devices, for example).
   * @return {Boolean}
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
    this.uppy.log('[DragDrop] Files dropped')

    files.forEach((file) => {
      this.uppy.addFile({
        source: this.id,
        name: file.name,
        type: file.type,
        data: file
      })
    })
  }

  onInputChange (ev) {
    this.uppy.log('[DragDrop] Files selected through input')

    const files = toArray(ev.target.files)

    files.forEach((file) => {
      this.uppy.addFile({
        source: this.id,
        name: file.name,
        type: file.type,
        data: file
      })
    })
  }

  onBrowseClick (ev) {
    this.input.click()
  }

  render (state) {
    return (
      <div class={`Uppy UppyTheme--default uppy-DragDrop-container ${this.isDragDropSupported ? 'is-dragdrop-supported' : ''}`}
           style={`width: ${this.opts.width}; height: ${this.opts.height};`}
           onclick={this.onBrowseClick}>
        <div class="uppy-DragDrop-inner">
          <svg aria-hidden="true" class="UppyIcon uppy-DragDrop-arrow" width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 10V0H5v10H2l6 6 6-6h-3zm0 0" fill-rule="evenodd"/>
          </svg>
          <input class="uppy-DragDrop-input"
                 type="file"
                 name="files[]"
                 multiple="true"
                 value=""
                 ref={(input) => {
                   this.input = input
                 }}
                 onchange={this.onInputChange} />
          <label class="uppy-DragDrop-label" onclick={this.onBrowseClick}>
            {this.i18n('dropHereOr')} <span class="uppy-DragDrop-dragText">{this.i18n('browse')}</span>
          </label>
          <span class="uppy-DragDrop-note">{this.opts.note}</span>
        </div>
      </div>
    )
  }

  install () {
    const target = this.opts.target
    if (target) {
      this.mount(target, this)
    }
    this.removeDragDropListener = dragDrop(this.el, (files) => {
      this.handleDrop(files)
      this.uppy.log(files)
    })
  }

  uninstall () {
    this.unmount()
    this.removeDragDropListener()
  }
}
