import { UIPlugin } from '@uppy/core'
import toArray from '@uppy/utils/lib/toArray'
import isDragDropSupported from '@uppy/utils/lib/isDragDropSupported'
import getDroppedFiles from '@uppy/utils/lib/getDroppedFiles'
import { h } from 'preact'

import packageJson from '../package.json'
import locale from './locale.js'

/**
 * Drag & Drop plugin
 *
 */
export default class DragDrop extends UIPlugin {
  static VERSION = packageJson.version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'acquirer'
    this.id = this.opts.id || 'DragDrop'
    this.title = 'Drag & Drop'

    this.defaultLocale = locale

    // Default options, must be kept in sync with @uppy/react/src/DragDrop.js.
    const defaultOpts = {
      target: null,
      inputName: 'files[]',
      width: '100%',
      height: '100%',
      note: null,
    }

    // Merge default options with the ones set by user
    this.opts = { ...defaultOpts, ...opts }

    this.i18nInit()

    // Check for browser dragDrop support
    this.isDragDropSupported = isDragDropSupported()
    this.removeDragOverClassTimeout = null

    // Bind `this` to class methods
    this.onInputChange = this.onInputChange.bind(this)
    this.handleDragOver = this.handleDragOver.bind(this)
    this.handleDragLeave = this.handleDragLeave.bind(this)
    this.handleDrop = this.handleDrop.bind(this)
    this.addFiles = this.addFiles.bind(this)
    this.render = this.render.bind(this)
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
        relativePath: file.relativePath || null,
      },
    }))

    try {
      this.uppy.addFiles(descriptors)
    } catch (err) {
      this.uppy.log(err)
    }
  }

  onInputChange (event) {
    const files = toArray(event.target.files)
    if (files.length > 0) {
      this.uppy.log('[DragDrop] Files selected through input')
      this.addFiles(files)
    }

    // We clear the input after a file is selected, because otherwise
    // change event is not fired in Chrome and Safari when a file
    // with the same name is selected.
    // ___Why not use value="" on <input/> instead?
    //    Because if we use that method of clearing the input,
    //    Chrome will not trigger change if we drop the same file twice (Issue #768).
    // eslint-disable-next-line no-param-reassign
    event.target.value = null
  }

  handleDragOver (event) {
    event.preventDefault()
    event.stopPropagation()

    // Check if the "type" of the datatransfer object includes files. If not, deny drop.
    const { types } = event.dataTransfer
    const hasFiles = types.some(type => type === 'Files')
    const { allowNewUpload } = this.uppy.getState()
    if (!hasFiles || !allowNewUpload) {
      // eslint-disable-next-line no-param-reassign
      event.dataTransfer.dropEffect = 'none'
      clearTimeout(this.removeDragOverClassTimeout)
      return
    }

    // Add a small (+) icon on drop
    // (and prevent browsers from interpreting this as files being _moved_ into the browser
    // https://github.com/transloadit/uppy/issues/1978)
    //
    // eslint-disable-next-line no-param-reassign
    event.dataTransfer.dropEffect = 'copy'

    clearTimeout(this.removeDragOverClassTimeout)
    this.setPluginState({ isDraggingOver: true })

    this.opts.onDragOver?.(event)
  }

  handleDragLeave (event) {
    event.preventDefault()
    event.stopPropagation()

    clearTimeout(this.removeDragOverClassTimeout)
    // Timeout against flickering, this solution is taken from drag-drop library.
    // Solution with 'pointer-events: none' didn't work across browsers.
    this.removeDragOverClassTimeout = setTimeout(() => {
      this.setPluginState({ isDraggingOver: false })
    }, 50)

    this.opts.onDragLeave?.(event)
  }

  handleDrop = async (event) => {
    event.preventDefault()
    event.stopPropagation()
    clearTimeout(this.removeDragOverClassTimeout)

    // Remove dragover class
    this.setPluginState({ isDraggingOver: false })

    const logDropError = (error) => {
      this.uppy.log(error, 'error')
    }

    // Add all dropped files
    const files = await getDroppedFiles(event.dataTransfer, { logDropError })
    if (files.length > 0) {
      this.uppy.log('[DragDrop] Files dropped')
      this.addFiles(files)
    }

    this.opts.onDrop?.(event)
  }

  renderHiddenFileInput () {
    const { restrictions } = this.uppy.opts
    return (
      <input
        className="uppy-DragDrop-input"
        type="file"
        hidden
        ref={(ref) => { this.fileInputRef = ref }}
        name={this.opts.inputName}
        multiple={restrictions.maxNumberOfFiles !== 1}
        accept={restrictions.allowedFileTypes}
        onChange={this.onInputChange}
      />
    )
  }

  static renderArrowSvg () {
    return (
      <svg aria-hidden="true" focusable="false" className="uppy-c-icon uppy-DragDrop-arrow" width="16" height="16" viewBox="0 0 16 16">
        <path d="M11 10V0H5v10H2l6 6 6-6h-3zm0 0" fillRule="evenodd" />
      </svg>
    )
  }

  renderLabel () {
    return (
      <div className="uppy-DragDrop-label">
        {this.i18nArray('dropHereOr', {
          browse: <span className="uppy-DragDrop-browse">{this.i18n('browse')}</span>,
        })}
      </div>
    )
  }

  renderNote () {
    return (
      <span className="uppy-DragDrop-note">{this.opts.note}</span>
    )
  }

  render () {
    const dragDropClass = `uppy-u-reset
      uppy-DragDrop-container
      ${this.isDragDropSupported ? 'uppy-DragDrop--isDragDropSupported' : ''}
      ${this.getPluginState().isDraggingOver ? 'uppy-DragDrop--isDraggingOver' : ''}
    `

    const dragDropStyle = {
      width: this.opts.width,
      height: this.opts.height,
    }

    return (
      <button
        type="button"
        className={dragDropClass}
        style={dragDropStyle}
        onClick={() => this.fileInputRef.click()}
        onDragOver={this.handleDragOver}
        onDragLeave={this.handleDragLeave}
        onDrop={this.handleDrop}
      >
        {this.renderHiddenFileInput()}
        <div className="uppy-DragDrop-inner">
          {DragDrop.renderArrowSvg()}
          {this.renderLabel()}
          {this.renderNote()}
        </div>
      </button>
    )
  }

  install () {
    const { target } = this.opts

    this.setPluginState({
      isDraggingOver: false,
    })

    if (target) {
      this.mount(target, this)
    }
  }

  uninstall () {
    this.unmount()
  }
}
