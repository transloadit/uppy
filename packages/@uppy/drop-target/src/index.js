import BasePlugin from '@uppy/core/lib/BasePlugin.js'
import getDroppedFiles from '@uppy/utils/lib/getDroppedFiles'
import toArray from '@uppy/utils/lib/toArray'

import packageJson from '../package.json'

function isFileTransfer (event) {
  return event.dataTransfer.types?.some((type) => type === 'Files') ?? false
}

/**
 * Drop Target plugin
 *
 */
export default class DropTarget extends BasePlugin {
  static VERSION = packageJson.version

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

  handleDrop = async (event) => {
    if (!isFileTransfer(event)) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    clearTimeout(this.removeDragOverClassTimeout)

    // Remove dragover class
    event.currentTarget.classList.remove('uppy-is-drag-over')
    this.setPluginState({ isDraggingOver: false })

    // Let any acquirer plugin (Url/Webcam/etc.) handle drops to the root
    this.uppy.iteratePlugins((plugin) => {
      if (plugin.type === 'acquirer') {
        // Every Plugin with .type acquirer can define handleRootDrop(event)
        plugin.handleRootDrop?.(event)
      }
    })

    // Add all dropped files, handle errors
    let executedDropErrorOnce = false
    const logDropError = (error) => {
      this.uppy.log(error, 'error')

      // In practice all drop errors are most likely the same,
      // so let's just show one to avoid overwhelming the user
      if (!executedDropErrorOnce) {
        this.uppy.info(error.message, 'error')
        executedDropErrorOnce = true
      }
    }

    const files = await getDroppedFiles(event.dataTransfer, { logDropError })
    if (files.length > 0) {
      this.uppy.log('[DropTarget] Files were dropped')
      this.addFiles(files)
    }

    this.opts.onDrop?.(event)
  }

  handleDragOver = (event) => {
    if (!isFileTransfer(event)) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    // Add a small (+) icon on drop
    // (and prevent browsers from interpreting this as files being _moved_ into the browser,
    // https://github.com/transloadit/uppy/issues/1978)
    event.dataTransfer.dropEffect = 'copy' // eslint-disable-line no-param-reassign

    clearTimeout(this.removeDragOverClassTimeout)
    event.currentTarget.classList.add('uppy-is-drag-over')
    this.setPluginState({ isDraggingOver: true })
    this.opts.onDragOver?.(event)
  }

  handleDragLeave = (event) => {
    if (!isFileTransfer(event)) {
      return
    }

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
    this.opts.onDragLeave?.(event)
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
