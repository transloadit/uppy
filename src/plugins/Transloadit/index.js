const Plugin = require('../Plugin')
const Client = require('./Client')
const StatusSocket = require('./Socket')

/**
 * Upload files to Transloadit using Tus.
 */
module.exports = class Transloadit extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'uploader'
    this.id = 'Transloadit'
    this.title = 'Transloadit'

    const defaultLocale = {
      strings: {
        creatingAssembly: 'Preparing upload...',
        creatingAssemblyFailed: 'Transloadit: Could not create assembly',
        encoding: 'Encoding...'
      }
    }

    const defaultOptions = {
      waitForEncoding: false,
      waitForMetadata: false,
      signature: null,
      params: null,
      fields: {},
      locale: defaultLocale
    }

    this.opts = Object.assign({}, defaultOptions, opts)

    this.locale = Object.assign({}, defaultLocale, this.opts.locale)
    this.locale.strings = Object.assign({}, defaultLocale.strings, this.opts.locale.strings)

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
      throw new Error('Transloadit: The `params.auth.key` option is required. ' +
        'You can find your Transloadit API key at https://transloadit.com/accounts/credentials.')
    }

    this.client = new Client()
  }

  createAssembly (filesToUpload) {
    this.core.log('Transloadit: create assembly')

    return this.client.createAssembly({
      params: this.opts.params,
      fields: this.opts.fields,
      expectedFiles: Object.keys(filesToUpload).length,
      signature: this.opts.signature
    }).then((assembly) => {
      this.updateState({
        assemblies: Object.assign(this.state.assemblies, {
          [assembly.assembly_id]: assembly
        })
      })

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
        const transloadit = {
          assembly: assembly.assembly_id
        }
        return Object.assign(
          {},
          file,
          { meta, tus, transloadit }
        )
      }

      const files = Object.assign({}, this.core.state.files)
      Object.keys(filesToUpload).forEach((id) => {
        files[id] = attachAssemblyMetadata(files[id], assembly)
      })

      this.core.setState({ files })

      return this.connectSocket(assembly)
    }).then(() => {
      this.core.log('Transloadit: Created assembly')
    }).catch((err) => {
      this.core.emit('informer', this.opts.locale.strings.creatingAssemblyFailed, 'error', 0)

      // Reject the promise.
      throw err
    })
  }

  shouldWait () {
    return this.opts.waitForEncoding || this.opts.waitForMetadata
  }

  findFile (uploadedFile) {
    const files = this.core.state.files
    for (const id in files) {
      if (!files.hasOwnProperty(id)) {
        continue
      }
      if (files[id].uploadURL === uploadedFile.tus_upload_url) {
        return files[id]
      }
    }
  }

  onFileUploadComplete (uploadedFile) {
    const file = this.findFile(uploadedFile)
    this.updateState({
      files: Object.assign({}, this.state.files, {
        [uploadedFile.id]: {
          id: file.id,
          uploadedFile
        }
      })
    })
    this.core.bus.emit('transloadit:upload', uploadedFile)
  }

  onResult (stepName, result) {
    const file = this.state.files[result.original_id]
    // The `file` may not exist if an import robot was used instead of a file upload.
    result.localId = file ? file.id : null

    this.updateState({
      results: this.state.results.concat(result)
    })
    this.core.bus.emit('transloadit:result', stepName, result)
  }

  connectSocket (assembly) {
    this.socket = new StatusSocket(
      assembly.websocket_url,
      assembly
    )

    this.socket.on('upload', this.onFileUploadComplete.bind(this))

    if (this.opts.waitForEncoding) {
      this.socket.on('result', this.onResult.bind(this))
    }

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
    }).then(() => {
      this.core.log('Transloadit: Socket is ready')
    })
  }

  prepareUpload (fileIDs) {
    this.core.emit('informer', this.opts.locale.strings.creatingAssembly, 'info', 0)
    const filesToUpload = fileIDs.map(getFile, this).reduce(intoFileMap, {})
    function getFile (fileID) {
      return this.core.state.files[fileID]
    }
    function intoFileMap (map, file) {
      map[file.id] = file
      return map
    }

    return this.createAssembly(filesToUpload).then(() => {
      this.core.emit('informer:hide')
    })
  }

  afterUpload (fileIDs) {
    // If we don't have to wait for encoding metadata or results, we can close
    // the socket immediately and finish the upload.
    if (!this.shouldWait()) {
      this.socket.close()
      return
    }

    const fileID = fileIDs[0]
    const file = this.core.state.files[fileID]
    const assembly = this.state.assemblies[file.assembly]

    this.core.emit('informer', this.opts.locale.strings.encoding, 'info', 0)
    return this.assemblyReady.then(() => {
      return this.client.getAssemblyStatus(assembly.assembly_ssl_url)
    }).then((assembly) => {
      this.updateState({
        assemblies: Object.assign({}, this.state.assemblies, {
          [assembly.assembly_id]: assembly
        })
      })

      // TODO set the `file.uploadURL` to a result?
      // We will probably need an option here so the plugin user can tell us
      // which result to pick…?

      this.core.emit('informer:hide')
    }).catch((err) => {
      // Always hide the Informer
      this.core.emit('informer:hide')

      throw err
    })
  }

  install () {
    this.core.addPreProcessor(this.prepareUpload)
    this.core.addPostProcessor(this.afterUpload)

    this.updateState({
      assemblies: {},
      files: {},
      results: []
    })
  }

  uninstall () {
    this.core.removePreProcessor(this.prepareUpload)
    this.core.removePostProcessor(this.afterUpload)
  }

  get state () {
    return this.core.state.transloadit || {}
  }

  updateState (newState) {
    const transloadit = Object.assign({}, this.state, newState)

    this.core.setState({ transloadit })
  }
}
