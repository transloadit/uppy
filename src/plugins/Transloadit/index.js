const Plugin = require('../Plugin')

module.exports = class Transloadit extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'uploader'
    this.id = 'Transloadit'
    this.title = 'Transloadit'

    const defaultOptions = {
      templateId: null
    }

    this.opts = Object.assign({}, defaultOptions, opts)

    if (!this.opts.templateId) {
      throw new Error('Transloadit: The `templateId` option is required.')
    }
  }

  createAssembly () {
    this.core.log('Transloadit: create assembly')

    return Promise.resolve()
  }

  uploadFiles () {
    this.core.log('Transloadit: upload files')

    return Promise.resolve()
  }

  install () {
    const bus = this.core.emitter
    bus.on('core:upload', () => {
      this.createAssembly()
        .then(() => this.uploadFiles())
    })
  }
}
