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
      getAssemblyOptions (file, options) {
        return {
          params: options.params,
          signature: options.signature,
          fields: options.fields
        }
      },
      locale: defaultLocale
    }

    this.opts = Object.assign({}, defaultOptions, opts)

    this.locale = Object.assign({}, defaultLocale, this.opts.locale)
    this.locale.strings = Object.assign({}, defaultLocale.strings, this.opts.locale.strings)

    this.prepareUpload = this.prepareUpload.bind(this)
    this.afterUpload = this.afterUpload.bind(this)

    if (this.opts.params) {
      this.validateParams(this.opts.params)
    }

    this.client = new Client()
    this.sockets = {}
  }

  validateParams (params) {
    if (!params) {
      throw new Error('Transloadit: The `params` option is required.')
    }

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
  }

  getAssemblyOptions (fileIDs) {
    const options = this.opts
    return Promise.all(
      fileIDs.map((fileID) => {
        const file = this.core.getFile(fileID)
        const promise = Promise.resolve(options.getAssemblyOptions(file, options))
        return promise.then((assemblyOptions) => {
          this.validateParams(assemblyOptions.params)

          return {
            fileIDs: [fileID],
            options: assemblyOptions
          }
        })
      })
    )
  }

  dedupeAssemblyOptions (list) {
    const dedupeMap = Object.create(null)
    list.forEach(({ fileIDs, options }) => {
      const id = JSON.stringify(options)
      if (dedupeMap[id]) {
        dedupeMap[id].fileIDs.push(...fileIDs)
      } else {
        dedupeMap[id] = {
          options,
          fileIDs: [...fileIDs]
        }
      }
    })

    return Object.keys(dedupeMap).map((id) => dedupeMap[id])
  }

  createAssembly (fileIDs, options) {
    this.core.log('Transloadit: create assembly')

    return this.client.createAssembly({
      params: options.params,
      fields: options.fields,
      expectedFiles: fileIDs.length,
      signature: options.signature
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
      fileIDs.forEach((id) => {
        files[id] = attachAssemblyMetadata(files[id], assembly)
      })

      this.core.setState({ files })

      this.core.emit('transloadit:assembly-created', assembly, fileIDs)

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

  onFileUploadComplete (assemblyId, uploadedFile) {
    const file = this.findFile(uploadedFile)
    this.updateState({
      files: Object.assign({}, this.state.files, {
        [uploadedFile.id]: {
          id: file.id,
          uploadedFile
        }
      })
    })
    this.core.bus.emit('transloadit:upload', uploadedFile, this.getAssembly(assemblyId))
  }

  onResult (assemblyId, stepName, result) {
    const file = this.state.files[result.original_id]
    // The `file` may not exist if an import robot was used instead of a file upload.
    result.localId = file ? file.id : null

    this.updateState({
      results: this.state.results.concat(result)
    })
    this.core.bus.emit('transloadit:result', stepName, result, this.getAssembly(assemblyId))
  }

  onAssemblyFinished (url) {
    this.client.getAssemblyStatus(url).then((assembly) => {
      this.updateState({
        assemblies: Object.assign({}, this.state.assemblies, {
          [assembly.assembly_id]: assembly
        })
      })
      this.core.emit('transloadit:complete', assembly)
    })
  }

  connectSocket (assembly) {
    const socket = new StatusSocket(
      assembly.websocket_url,
      assembly
    )
    this.sockets[assembly.assembly_id] = socket

    socket.on('upload', this.onFileUploadComplete.bind(this, assembly.assembly_id))
    socket.on('error', (error) => {
      this.core.emit('transloadit:assembly-error', assembly, error)
    })

    if (this.opts.waitForEncoding) {
      socket.on('result', this.onResult.bind(this, assembly.assembly_id))
    }

    if (this.opts.waitForEncoding) {
      socket.on('finished', () => {
        this.onAssemblyFinished(assembly.assembly_ssl_url)
      })
    } else if (this.opts.waitForMetadata) {
      socket.on('metadata', () => {
        this.onAssemblyFinished(assembly.assembly_ssl_url)
        this.core.emit('transloadit:complete', assembly)
      })
    }

    return new Promise((resolve, reject) => {
      socket.on('connect', resolve)
      socket.on('error', reject)
    }).then(() => {
      this.core.log('Transloadit: Socket is ready')
    })
  }

  prepareUpload (fileIDs) {
    fileIDs.forEach((fileID) => {
      this.core.emit('core:preprocess-progress', fileID, {
        mode: 'indeterminate',
        message: this.opts.locale.strings.creatingAssembly
      })
    })

    const createAssembly = ({ fileIDs, options }) => {
      return this.createAssembly(fileIDs, options).then(() => {
        fileIDs.forEach((fileID) => {
          this.core.emit('core:preprocess-complete', fileID)
        })
      })
    }

    return this.getAssemblyOptions(fileIDs)
      .then((allOptions) => this.dedupeAssemblyOptions(allOptions))
      .then((assemblies) => Promise.all(
        assemblies.map(createAssembly)
      ))
  }

  afterUpload (fileIDs) {
    // A file ID that is part of this assembly...
    const fileID = fileIDs[0]

    // If we don't have to wait for encoding metadata or results, we can close
    // the socket immediately and finish the upload.
    if (!this.shouldWait()) {
      const file = this.core.getFile(fileID)
      const socket = this.socket[file.assembly]
      socket.close()
      return
    }

    return new Promise((resolve, reject) => {
      fileIDs.forEach((fileID) => {
        this.core.emit('core:postprocess-progress', fileID, {
          mode: 'indeterminate',
          message: this.opts.locale.strings.encoding
        })
      })

      const onAssemblyFinished = (assembly) => {
        const file = this.core.getFile(fileID)
        // An assembly for a different upload just finished. We can ignore it.
        if (assembly.assembly_id !== file.transloadit.assembly) {
          return
        }
        // Remove this handler once we find the assembly we needed.
        this.core.emitter.off('transloadit:complete', onAssemblyFinished)

        // TODO set the `file.uploadURL` to a result?
        // We will probably need an option here so the plugin user can tell us
        // which result to pick…?

        fileIDs.forEach((fileID) => {
          this.core.emit('core:postprocess-complete', fileID)
        })

        resolve()
      }

      const onAssemblyError = (assembly, error) => {
        const file = this.core.getFile(fileID)
        // An assembly for a different upload just errored. We can ignore it.
        if (assembly.assembly_id !== file.transloadit.assembly) {
          return
        }
        // Remove this handler once we find the assembly we needed.
        this.core.emitter.off('transloadit:assembly-error', onAssemblyError)

        // Clear postprocessing state for all our files.
        fileIDs.forEach((fileID) => {
          this.core.emit('core:postprocess-complete', fileID)
        })

        // Reject the `afterUpload()` promise.
        reject(error)
      }

      this.core.on('transloadit:complete', onAssemblyFinished)
      this.core.on('transloadit:assembly-error', onAssemblyError)
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

  getAssembly (id) {
    return this.state.assemblies[id]
  }

  get state () {
    return this.core.state.transloadit || {}
  }

  updateState (newState) {
    const transloadit = Object.assign({}, this.state, newState)

    this.core.setState({ transloadit })
  }
}
