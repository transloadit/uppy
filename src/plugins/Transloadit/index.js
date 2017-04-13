const Plugin = require('../Plugin')
const Client = require('./Client')
const StatusSocket = require('./Socket')

module.exports = class Transloadit extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'uploader'
    this.id = 'Transloadit'
    this.title = 'Transloadit'

    const defaultOptions = {
      waitForEncoding: false,
      waitForMetadata: false,
      signature: null,
      params: null
    }

    this.opts = Object.assign({}, defaultOptions, opts)

    this.prepareUpload = this.prepareUpload.bind(this)
    this.afterUpload = this.afterUpload.bind(this)

    if (!this.opts.params) {
      throw new Error('Transloadit: The `params` option is required.')
    }

    let params = this.opts.params
    if (typeof params === 'string') {
      try {
        params = JSON.parse(params)
      } catch (err) {
        // Tell the user that this is not an Uppy bug!
        err.message = 'Transloadit: The `params` option is a malformed JSON string: ' +
          err.message
        throw err
      }
    }

    if (!params.auth || !params.auth.key) {
      throw new Error('Transloadit: The `params.auth.key` option is required.' +
        'You can find your Transloadit API key at https://transloadit.com/accounts/credentials.')
    }

    this.client = new Client()
  }

  createAssembly () {
    this.core.log('Transloadit: create assembly')

    return this.client.createAssembly({
      params: this.opts.params,
      expectedFiles: Object.keys(this.core.state.files).length,
      signature: this.opts.signature
    }).then((assembly) => {
      this.updateState({ assembly })

      function attachAssemblyMetadata (file, assembly) {
        // Attach meta parameters for the Tus plugin. See:
        // https://github.com/tus/tusd/wiki/Uploading-to-Transloadit-using-tus#uploading-using-tus
        // TODO Should this `meta` be moved to a `tus.meta` property instead?
        // If the MetaData plugin can add eg. resize parameters, it doesn't
        // make much sense to set those as upload-metadata for tus.
        const meta = Object.assign({}, file.meta, {
          assembly_url: assembly.assembly_url,
          filename: file.name,
          fieldname: 'file'
        })
        // Add assembly-specific Tus endpoint.
        const tus = Object.assign({}, file.tus, {
          endpoint: assembly.tus_url
        })
        return Object.assign(
          {},
          file,
          { meta, tus }
        )
      }

      const filesObj = this.core.state.files
      const files = {}
      Object.keys(filesObj).forEach((id) => {
        files[id] = attachAssemblyMetadata(filesObj[id], assembly)
      })

      this.core.setState({ files })

      if (this.opts.waitForEncoding || this.opts.waitForMetadata) {
        return this.beginWaiting()
      }
    }).catch((err) => {
      this.core.emit('informer', '⚠️ Transloadit: Could not create assembly', 'error', 0)

      // Reject the promise.
      throw err
    })
  }

  beginWaiting () {
    this.socket = new StatusSocket(
      this.state.assembly.websocket_url,
      this.state.assembly
    )

    this.assemblyReady = new Promise((resolve, reject) => {
      if (this.opts.waitForEncoding) {
        this.socket.on('finished', resolve)
      } else if (this.opts.waitForMetadata) {
        this.socket.on('metadata', resolve)
      }
      this.socket.on('error', reject)
    })

    return new Promise((resolve, reject) => {
      this.socket.on('connect', resolve)
      this.socket.on('error', reject)
    })
  }

  prepareUpload () {
    this.core.emit('informer', '🔄 Preparing upload...', 'info', 0)
    return this.createAssembly().then(() => {
      this.core.emit('informer:hide')
    })
  }

  afterUpload () {
    this.core.emit('informer', '🔄 Encoding...', 'info', 0)
    return this.assemblyReady.then(() => {
      this.core.emit('informer:hide')
    })
  }

  install () {
    this.core.addPreProcessor(this.prepareUpload)
    if (this.opts.wait) {
      this.core.addPostProcessor(this.afterUpload)
    }
  }

  uninstall () {
    this.core.removePreProcessor(this.prepareUpload)
    if (this.opts.wait) {
      this.core.removePostProcessor(this.afterUpload)
    }
  }

  get state () {
    return this.core.state.transloadit || {}
  }

  updateState (newState) {
    const transloadit = Object.assign({}, this.state, newState)

    this.core.setState({ transloadit })
  }
}
