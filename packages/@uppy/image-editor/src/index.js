const { Plugin } = require('@uppy/core')
const { h } = require('preact')
const Editor = require('./Editor')

module.exports = class ImageEditor extends Plugin {
  static VERSION = require('../package.json').version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'ImageEditor'
    this.title = 'Image Editor'
    this.type = 'editor'

    // Default options
    const defaultOptions = {}

    // Merge default options with the ones set by user
    this.opts = { ...defaultOptions, ...opts }
  }

  сanEditFile (file) {
    if (!file.type) {
      return false
    }
    const fileTypeSpecific = file.type.split('/')[1]

    if (/^(jpe?g|gif|png|bmp|webp)$/.test(fileTypeSpecific)) {
      return true
    }

    return false
  }

  save = (blob) => {
    const { currentImage } = this.getPluginState()

    this.uppy.setFileState(currentImage.id, {
      data: blob,
      size: blob.size,
      preview: null
    })
    const updatedFile = this.uppy.getFile(currentImage.id)
    this.uppy.emit('thumbnail:request', updatedFile)
    this.setPluginState({
      currentImage: updatedFile
    })
    this.uppy.emit('file-editor:complete', updatedFile)
  }

  selectFile = (file) => {
    this.setPluginState({
      currentImage: file
    })
  }

  install () {
    this.setPluginState({
      currentImage: null
    })

    const target = this.opts.target
    if (target) {
      this.mount(target, this)
    }
  }

  uninstall () {
    this.unmount()
  }

  render () {
    const { currentImage } = this.getPluginState()
    if (currentImage === null) {
      return
    }

    return (
      <Editor
        currentImage={currentImage}
        save={this.save}
      />
    )
  }
}
