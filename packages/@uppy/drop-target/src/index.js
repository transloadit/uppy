const { Plugin } = require('@uppy/core')
const getDroppedFiles = require('@uppy/utils/lib/getDroppedFiles')
const toArray = require('@uppy/utils/lib/toArray')

/**
 * Drop Target plugin
 *
 */
module.exports = class DropTarget extends Plugin {
  static VERSION = require('../package.json').version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'acquirer'
    this.id = this.opts.id || 'DropTarget'
    this.title = 'Drop Target'

    // Default options
    const defaultOpts = {
      target: null,
    }

    // Merge default options with the ones set by user
    this.opts = { ...defaultOpts, ...opts }
    this.removeDragOverClassTimeout = null
  }

  addFiles = (files) => {
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

  handleDrop = (event) => {
    event.preventDefault()
    event.stopPropagation()
    clearTimeout(this.removeDragOverClassTimeout)

    // 2. Remove dragover class
    event.currentTarget.classList.remove('uppy-is-drag-over')
    this.setPluginState({ isDraggingOver: false })

    // 3. Add all dropped files
    this.uppy.log('[DropTarget] Files were dropped')
    const logDropError = (error) => {
      this.uppy.log(error, 'error')
    }
    getDroppedFiles(event.dataTransfer, { logDropError })
      .then((files) => this.addFiles(files))
  }

  handleDragOver = (event) => {
    event.preventDefault()
    event.stopPropagation()

    // 1. Add a small (+) icon on drop
    // (and prevent browsers from interpreting this as files being _moved_ into the browser,
    // https://github.com/transloadit/uppy/issues/1978)
    event.dataTransfer.dropEffect = 'copy'

    clearTimeout(this.removeDragOverClassTimeout)
    event.currentTarget.classList.add('uppy-is-drag-over')
    this.setPluginState({ isDraggingOver: true })
  }

  handleDragLeave = (event) => {
    event.preventDefault()
    event.stopPropagation()

    const { currentTarget } = event

    clearTimeout(this.removeDragOverClassTimeout)
    // Timeout against flickering, this solution is taken from drag-drop library.
    // Solution with 'pointer-events: none' didn't work across browsers.
    this.removeDragOverClassTimeout = setTimeout(() => {
      currentTarget.classList.remove('uppy-is-drag-over')
      this.setPluginState({ isDraggingOver: false })
    }, 50)
  }

  addListeners = () => {
    const { target } = this.opts

    if (target instanceof Element) {
      this.nodes = [target]
    } else if (typeof target === 'string') {
      this.nodes = toArray(document.querySelectorAll(target))
    }

    if (!this.nodes && !this.nodes.length > 0) {
      throw new Error(`"${target}" does not match any HTML elements`)
    }

    this.nodes.forEach((node) => {
      node.addEventListener('dragover', this.handleDragOver, false)
      node.addEventListener('dragleave', this.handleDragLeave, false)
      node.addEventListener('drop', this.handleDrop, false)
    })
  }

  removeListeners = () => {
    if (this.nodes) {
      this.nodes.forEach((node) => {
        node.removeEventListener('dragover', this.handleDragOver, false)
        node.removeEventListener('dragleave', this.handleDragLeave, false)
        node.removeEventListener('drop', this.handleDrop, false)
      })
    }
  }

  install () {
    this.setPluginState({ isDraggingOver: false })
    this.addListeners()
  }

  uninstall () {
    this.removeListeners()
  }
}
