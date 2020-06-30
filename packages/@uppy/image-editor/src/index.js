const { Plugin } = require('@uppy/core')
const Cropper = require('cropperjs')
// const Translator = require('@uppy/utils/lib/Translator')
const { h } = require('preact')

module.exports = class ImageEditor extends Plugin {
  static VERSION = require('../package.json').version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'ImageEditor'
    this.title = 'Image Editor'
    this.type = 'editor'

    // this.defaultLocale = {
    //   strings: {
    //     chooseFiles: 'Choose files'
    //   }
    // }

    // Default options
    const defaultOptions = {}

    // Merge default options with the ones set by user
    this.opts = { ...defaultOptions, ...opts }

    // this.i18nInit()
  }

  // setOptions (newOpts) {
  //   super.setOptions(newOpts)
  //   this.i18nInit()
  // }

  // i18nInit () {
  //   this.translator = new Translator([this.defaultLocale, this.uppy.locale, this.opts.locale])
  //   this.i18n = this.translator.translate.bind(this.translator)
  //   this.i18nArray = this.translator.translateArray.bind(this.translator)
  //   this.setPluginState() // so that UI re-renders and we see the updated locale
  // }

  edit = () => {
    const { currentImage } = this.getPluginState()

    this.cropper.rotate(90)
    this.cropper.getCroppedCanvas().toBlob((blob) => {
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
      this.cropper.destroy()
    })
  }

  initEditor = () => {
    console.log(this.imgElement)
    const { currentImage } = this.getPluginState()

    if (currentImage.preview) {
      this.cropper = new Cropper(this.imgElement, {
        aspectRatio: 16 / 9
        // crop (event) {
        //   console.log(event.detail.x)
        //   console.log(event.detail.y)
        //   console.log(event.detail.width)
        //   console.log(event.detail.height)
        //   console.log(event.detail.rotate)
        //   console.log(event.detail.scaleX)
        //   console.log(event.detail.scaleY)
        // }
      })
    }
  }

  selectFile = (file) => {
    console.log('set current image!', file)
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
    const imageURL = URL.createObjectURL(currentImage.data)

    return (
      <div class="uppy-ImageCropper">
        <img
          class="uppy-ImageCropper-image"
          alt={currentImage.name}
          src={imageURL}
          ref={(ref) => { this.imgElement = ref }}
        />
      </div>
    )
  }
}
