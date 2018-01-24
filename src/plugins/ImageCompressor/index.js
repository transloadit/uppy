const Plugin = require('../../core/Plugin')
const Compressor = require('@xkeshi/image-compressor')

module.exports = class ImageCompressor extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'modifiers'
    this.id = 'ImageCompressor'
    this.title = 'Image Compressor'

    const defaultOptions = {
      quality: 0.6,
      compressFile: this.compressFile.bind(this)
    }

    this.opts = Object.assign({}, defaultOptions, opts)
    this.prepareUpload = this.prepareUpload.bind(this)
  }

  compressFile (file) {
    return new Compressor()
      .compress(file.data, { quality: this.opts.quality })
  }

  prepareUpload (fileIDs) {
    return Promise.all(
      fileIDs.map((id) => {
        const file = this.uppy.getFile(id)
        const paramsPromise = Promise.resolve()
          .then(() => this.opts.compressFile(file))
        return paramsPromise
      })
    ).then(compressed => {
      const updatedFiles = {}
      fileIDs.forEach((id, index) => {
        const file = this.uppy.getFile(id)
        const updatedFile = Object.assign({}, file, {data: compressed[index]})

        updatedFiles[id] = updatedFile
      })

      this.uppy.setState({
        files: Object.assign({}, this.uppy.getState().files, updatedFiles)
      })
    })
  }

  install () {
    this.uppy.addPreProcessor(this.prepareUpload)
  }

  uninstall () {
    this.uppy.removePreProcessor(this.prepareUpload)
  }
}
