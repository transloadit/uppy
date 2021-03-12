const { Plugin } = require('@uppy/core')
const Editor = require('./Editor')
const Translator = require('@uppy/utils/lib/Translator')
const { h } = require('preact')

module.exports = class ImageEditor extends Plugin {
  static VERSION = require('../package.json').version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'ImageEditor'
    this.title = 'Image Editor'
    this.type = 'editor'

    this.defaultLocale = {
      strings: {
        save: 'Save',
        revert: 'Revert',
        rotate: 'Rotate',
        zoomIn: 'Zoom in',
        zoomOut: 'Zoom out',
        flipHorizontal: 'Flip horizonal',
        aspectRatioSquare: 'Crop square',
        aspectRatioLandscape: 'Crop landscape (16:9)',
        aspectRatioPortrait: 'Crop portrait (9:16)'
      }
    }

    const defaultCropperOptions = {
      viewMode: 1,
      background: false,
      autoCropArea: 1,
      responsive: true
    }

    const defaultActions = {
      revert: true,
      rotate: true,
      flip: true,
      zoomIn: true,
      zoomOut: true,
      cropSquare: true,
      cropWidescreen: true,
      cropWidescreenVertical: true
    }

    const defaultOptions = {
      quality: 0.8
    }

    this.opts = {
      ...defaultOptions,
      ...opts,
      actions: {
        ...defaultActions,
        ...opts.actions
      },
      cropperOptions: {
        ...defaultCropperOptions,
        ...opts.cropperOptions
      }
    }

    this.i18nInit()
  }

  setOptions (newOpts) {
    super.setOptions(newOpts)
    this.i18nInit()
  }

  i18nInit () {
    this.translator = new Translator([this.defaultLocale, this.uppy.locale, this.opts.locale])
    this.i18n = this.translator.translate.bind(this.translator)
    // this.i18nArray = this.translator.translateArray.bind(this.translator)
    this.setPluginState() // so that UI re-renders and we see the updated locale
  }

  canEditFile (file) {
    if (!file.type || file.isRemote) {
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
    this.uppy.emit('file-editor:start', file)
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
    if (currentImage === null || currentImage.isRemote) {
      return
    }

    return (
      <Editor
        currentImage={currentImage}
        save={this.save}
        opts={this.opts}
        i18n={this.i18n}
      />
    )
  }
}
