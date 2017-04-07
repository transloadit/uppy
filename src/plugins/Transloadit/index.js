const Plugin = require('../Plugin')
const Tus10Plugin = require('../Tus10')
const Client = require('./Client')

module.exports = class Transloadit extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'uploader'
    this.id = 'Transloadit'
    this.title = 'Transloadit'

    const defaultOptions = {
      templateId: null,
      resume: true,
      allowPause: true
    }

    this.opts = Object.assign({}, defaultOptions, opts)

    if (!this.opts.key) {
      throw new Error('Transloadit: The `key` option is required. ' +
        'You can find your Transloadit API key at https://transloadit.com/accounts/credentials.')
    }
    if (!this.opts.templateId) {
      throw new Error('Transloadit: The `templateId` option is required. ' +
        'You can find your template\'s ID at https://transloadit.com/templates.')
    }

    this.client = new Client({
      key: this.opts.key
    })
  }

  createAssembly () {
    this.core.log('Transloadit: create assembly')

    return this.client.createAssembly({
      templateId: this.opts.templateId,
      expectedFiles: Object.keys(this.core.state.files).length
    }).then((assembly) => {
      this.updateState({ assembly })

      function attachAssemblyMetadata (file, assembly) {
        const meta = Object.assign({}, file.meta, {
          assembly_url: assembly.assembly_url,
          filename: file.name,
          fieldname: 'file'
        })
        return Object.assign(
          {},
          file,
          { meta }
        )
      }

      const filesObj = this.core.state.files
      const files = {}
      Object.keys(filesObj).forEach((id) => {
        files[id] = attachAssemblyMetadata(filesObj[id], assembly)
      })

      this.core.setState({ files })
    }).catch((err) => {
      this.core.emit('informer', '⚠️ Transloadit: Could not create assembly', 'error', 0)

      // Reject the promise.
      throw err
    })
  }

  uploadFiles () {
    this.core.log(`Transloadit: upload files for ${this.state.assembly.assembly_ssl_url}`)
    const endpoint = this.client.getTusEndpoint()

    // Eh. I think we'll change this later? This is a bit fragile! 😅
    // We probably want to be able to set some meta properties, maybe on the
    // files, or in global state, to tell Tus where (and when) to upload.
    this.uploader = new Tus10Plugin(this.core, {
      endpoint,
      resume: this.opts.resume,
      allowPause: this.opts.allowPause
    })
    this.uploader.install()

    const files = Object.keys(this.core.state.files)
      .map((id) => this.core.state.files[id])
    this.uploader.uploadFiles(files)

    this.core.emitter.once('core:success', () => {
      this.uploader.uninstall()
    })
  }

  install () {
    const bus = this.core.emitter
    bus.on('core:upload', () => {
      this.createAssembly()
        .then(() => this.uploadFiles())
    })
  }

  get state () {
    return this.core.state.transloadit || {}
  }

  updateState (newState) {
    const transloadit = Object.assign({}, this.state, newState)

    this.core.setState({ transloadit })
  }
}
