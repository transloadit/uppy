const Translator = require('../../core/Translator')
const Plugin = require('../../core/Plugin')
const Client = require('./Client')
const StatusSocket = require('./Socket')

/**
 * Upload files to Transloadit using Tus.
 */
module.exports = class Transloadit extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)
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
      alwaysRunAssembly: false,
      importFromUploadURLs: false,
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

    this.translator = new Translator({ locale: this.locale })
    this.i18n = this.translator.translate.bind(this.translator)

    this.prepareUpload = this.prepareUpload.bind(this)
    this.afterUpload = this.afterUpload.bind(this)
    this.onFileUploadURLAvailable = this.onFileUploadURLAvailable.bind(this)
    this.onRestored = this.onRestored.bind(this)
    this.getPersistentData = this.getPersistentData.bind(this)

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
        const file = this.uppy.getFile(fileID)
        const promise = Promise.resolve()
          .then(() => options.getAssemblyOptions(file, options))
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

  createAssembly (fileIDs, uploadID, options) {
    const pluginOptions = this.opts

    this.uppy.log('Transloadit: create assembly')

    return this.client.createAssembly({
      params: options.params,
      fields: options.fields,
      expectedFiles: fileIDs.length,
      signature: options.signature
    }).then((assembly) => {
      // Store the list of assemblies related to this upload.
      const state = this.getPluginState()
      const assemblyList = state.uploadsAssemblies[uploadID]
      const uploadsAssemblies = Object.assign({}, state.uploadsAssemblies, {
        [uploadID]: assemblyList.concat([ assembly.assembly_id ])
      })

      this.setPluginState({
        assemblies: Object.assign(state.assemblies, {
          [assembly.assembly_id]: assembly
        }),
        uploadsAssemblies
      })

      function attachAssemblyMetadata (file, assembly) {
        // Attach meta parameters for the Tus plugin. See:
        // https://github.com/tus/tusd/wiki/Uploading-to-Transloadit-using-tus#uploading-using-tus
        // TODO Should this `meta` be moved to a `tus.meta` property instead?
        const tlMeta = {
          assembly_url: assembly.assembly_url,
          filename: file.name,
          fieldname: 'file'
        }
        const meta = Object.assign({}, file.meta, tlMeta)
        // Add assembly-specific Tus endpoint.
        const tus = Object.assign({}, file.tus, {
          endpoint: assembly.tus_url,
          // Only send assembly metadata to the tus endpoint.
          metaFields: Object.keys(tlMeta),
          // Make sure tus doesn't resume a previous upload.
          uploadUrl: null,
          // Disable tus-js-client fingerprinting, otherwise uploading the same file at different times
          // will upload to the same assembly.
          resume: false
        })
        const transloadit = {
          assembly: assembly.assembly_id
        }

        const newFile = Object.assign({}, file, { transloadit })
        // Only configure the Tus plugin if we are uploading straight to Transloadit (the default).
        if (!pluginOptions.importFromUploadURLs) {
          Object.assign(newFile, { meta, tus })
        }
        return newFile
      }

      const files = Object.assign({}, this.uppy.state.files)
      fileIDs.forEach((id) => {
        files[id] = attachAssemblyMetadata(files[id], assembly)
      })

      this.uppy.setState({ files })

      this.uppy.emit('transloadit:assembly-created', assembly, fileIDs)

      return this.connectSocket(assembly)
        .then(() => assembly)
    }).then((assembly) => {
      this.uppy.log('Transloadit: Created assembly')
      return assembly
    }).catch((err) => {
      this.uppy.info(this.i18n('creatingAssemblyFailed'), 'error', 0)

      // Reject the promise.
      throw err
    })
  }

  shouldWait () {
    return this.opts.waitForEncoding || this.opts.waitForMetadata
  }

  /**
   * Used when `importFromUploadURLs` is enabled: reserves all files in
   * the assembly.
   */
  reserveFiles (assembly, fileIDs) {
    return Promise.all(fileIDs.map((fileID) => {
      const file = this.uppy.getFile(fileID)
      return this.client.reserveFile(assembly, file)
    }))
  }

  /**
   * Used when `importFromUploadURLs` is enabled: adds files to the assembly
   * once they have been fully uploaded.
   */
  onFileUploadURLAvailable (fileID) {
    const file = this.uppy.getFile(fileID)
    if (!file || !file.transloadit || !file.transloadit.assembly) {
      return
    }

    const state = this.getPluginState()
    const assembly = state.assemblies[file.transloadit.assembly]

    this.client.addFile(assembly, file).catch((err) => {
      this.uppy.log(err)
      this.uppy.emit('transloadit:import-error', assembly, file.id, err)
    })
  }

  findFile (uploadedFile) {
    const files = this.uppy.state.files
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
    const state = this.getPluginState()
    const file = this.findFile(uploadedFile)
    this.setPluginState({
      files: Object.assign({}, state.files, {
        [uploadedFile.id]: {
          id: file.id,
          uploadedFile
        }
      })
    })
    this.uppy.emit('transloadit:upload', uploadedFile, this.getAssembly(assemblyId))
  }

  onResult (assemblyId, stepName, result) {
    const state = this.getPluginState()
    const file = state.files[result.original_id]
    // The `file` may not exist if an import robot was used instead of a file upload.
    result.localId = file ? file.id : null

    this.setPluginState({
      results: state.results.concat(result)
    })
    this.uppy.emit('transloadit:result', stepName, result, this.getAssembly(assemblyId))
  }

  onAssemblyFinished (url) {
    this.client.getAssemblyStatus(url).then((assembly) => {
      const state = this.getPluginState()
      this.setPluginState({
        assemblies: Object.assign({}, state.assemblies, {
          [assembly.assembly_id]: assembly
        })
      })
      this.uppy.emit('transloadit:complete', assembly)
    })
  }

  getPersistentData (setData) {
    const state = this.getPluginState()
    const assemblies = state.assemblies
    const uploads = Object.keys(state.files)
    const results = state.results.map((result) => result.id)

    setData({
      [this.id]: {
        assemblies,
        uploads,
        results
      }
    })
  }

  onRestored (pluginData) {
    const knownUploads = pluginData[this.id].files || []
    const knownResults = pluginData[this.id].results || []
    const previousAssemblies = pluginData[this.id].assemblies || {}

    const allUploads = []
    const allResults = []

    // Fetch up-to-date assembly statuses.
    const loadAssemblies = () => {
      const fileIDs = Object.keys(this.core.state.files)
      const assemblyIDs = []
      fileIDs.forEach((fileID) => {
        const file = this.core.getFile(fileID)
        const assemblyID = file && file.transloadit && file.transloadit.assembly
        if (assemblyID && assemblyIDs.indexOf(assemblyID) === -1) {
          assemblyIDs.push(file.transloadit.assembly)
        }
      })

      return Promise.all(
        assemblyIDs.map((assemblyID) => {
          const url = `https://api2.transloadit.com/assemblies/${assemblyID}`
          return this.client.getAssemblyStatus(url)
        })
      )
    }

    const reconnectSockets = (assemblies) => {
      return Promise.all(assemblies.map((assembly) => {
        // No need to connect to the socket if the assembly has completed by now.
        if (assembly.ok === 'ASSEMBLY_COMPLETE') {
          return null
        }
        return this.connectSocket(assembly)
      }))
    }

    // Recover uploads / assemblies links based on the stored assembly ID
    // on files.
    const recoverUploadAssemblies = () => {
      const uploadsAssemblies = {}
      const uploads = this.core.state.currentUploads
      Object.keys(uploads).forEach((uploadID) => {
        const files = uploads[uploadID].fileIDs
          .map((fileID) => this.core.getFile(fileID))
        const assemblyIDs = []

        files.forEach((file) => {
          const assemblyID = file && file.transloadit && file.transloadit.assembly
          if (assemblyID && assemblyIDs.indexOf(assemblyID) === -1) {
            assemblyIDs.push(file.transloadit.assembly)
          }
        })

        uploadsAssemblies[uploadID] = assemblyIDs
      })

      return uploadsAssemblies
    }

    // Convert loaded assembly statuses to a Transloadit plugin state object.
    const restoreState = (assemblies) => {
      const assembliesById = {}
      const files = {}
      const results = []
      assemblies.forEach((assembly) => {
        assembliesById[assembly.assembly_id] = assembly

        assembly.uploads.forEach((uploadedFile) => {
          const file = this.findFile(uploadedFile)
          allUploads.push({
            assembly: assembly.assembly_id,
            uploadedFile
          })
          files[uploadedFile.id] = {
            id: file.id,
            uploadedFile
          }
        })

        const state = this.getPluginState()
        Object.keys(assembly.results).forEach((stepName) => {
          assembly.results[stepName].forEach((result) => {
            const file = state.files[result.original_id]
            result.localId = file ? file.id : null
            allResults.push({
              assembly: assembly.assembly_id,
              stepName,
              result
            })
            results.push(result)
          })
        })
      })

      const uploadsAssemblies = recoverUploadAssemblies()

      console.info('Transloadit: RESTORED:')
      console.info({
        assemblies: assembliesById,
        files: files,
        results: results,
        uploadsAssemblies: uploadsAssemblies
      })

      this.setPluginState({
        assemblies: assembliesById,
        files: files,
        results: results,
        uploadsAssemblies: uploadsAssemblies
      })
    }

    const emitMissedEvents = () => {
      // Emit events for completed uploads and completed results
      // that we've missed while we were away.
      const newUploads = allUploads.filter((up) => {
        return knownUploads.indexOf(up.uploadedFile.id) === -1
      })
      const newResults = allResults.filter((result) => {
        return knownResults.indexOf(result.result.id) === -1
      })

      console.log('[Transloadit] New fully uploaded files since restore:', newUploads)
      newUploads.forEach(({ assembly, uploadedFile }) => {
        console.log('  emitting transloadit:upload', uploadedFile.id)
        this.core.emit('transloadit:upload', uploadedFile, this.getAssembly(assembly))
      })
      console.log('[Transloadit] New results since restore:', newResults)
      newResults.forEach(({ assembly, stepName, result }) => {
        console.log('  emitting transloadit:result', stepName, result.id)
        this.core.emit('transloadit:result', stepName, result, this.getAssembly(assembly))
      })

      const newAssemblies = this.getPluginState().assemblies
      console.log('[Transloadit] Current assembly status after restore', newAssemblies)
      console.log('[Transloadit] Assembly status before restore', previousAssemblies)
      Object.keys(newAssemblies).forEach((assemblyId) => {
        const oldAssembly = previousAssemblies[assemblyId]
        diffAssemblyStatus(oldAssembly, newAssemblies[assemblyId])
      })
    }

    // Emit events for assemblies that have completed or errored while we were away.
    const diffAssemblyStatus = (prev, next) => {
      console.log('[Transloadit] Diff assemblies', prev, next)
      if (next.ok === 'ASSEMBLY_COMPLETED' && prev.ok !== 'ASSEMBLY_COMPLETED') {
        console.log('  Emitting transloadit:complete for', next.assembly_id, next)
        this.core.emit('transloadit:complete', next)
      }
      if (next.error && !prev.error) {
        console.log('  !!! Emitting transloadit:assembly-error for', next.assembly_id, next)
        this.core.emit('transloadit:assembly-error', next, new Error(next.message))
      }
    }

    // Restore all assembly state.
    this.restored = Promise.resolve()
      .then(loadAssemblies)
      .then((assemblies) => {
        restoreState(assemblies)
        return reconnectSockets(assemblies)
      })
      .then(() => {
        // Wait for a bit, so the Promise resolves and `afterUpload` can
        // add event handlers.
        // Then we emit the events.
        // This is reliable, because Promises use the microtask queue, and timeouts
        // use the macrotask queue—microtasks are executed first.
        setTimeout(emitMissedEvents, 10)
      })

    this.restored.then(() => {
      this.restored = null
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
      this.uppy.emit('transloadit:assembly-error', assembly, error)
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
        this.uppy.emit('transloadit:complete', assembly)
      })
    }

    return new Promise((resolve, reject) => {
      socket.on('connect', resolve)
      socket.on('error', reject)
    }).then(() => {
      this.uppy.log('Transloadit: Socket is ready')
    })
  }

  prepareUpload (fileIDs, uploadID) {
    // Only use files without errors
    fileIDs = fileIDs.filter((file) => !file.error)

    fileIDs.forEach((fileID) => {
      this.uppy.emit('preprocess-progress', fileID, {
        mode: 'indeterminate',
        message: this.i18n('creatingAssembly')
      })
    })

    const createAssembly = ({ fileIDs, options }) => {
      return this.createAssembly(fileIDs, uploadID, options).then((assembly) => {
        if (this.opts.importFromUploadURLs) {
          return this.reserveFiles(assembly, fileIDs)
        }
      }).then(() => {
        fileIDs.forEach((fileID) => {
          this.uppy.emit('preprocess-complete', fileID)
        })
      })
    }

    const state = this.getPluginState()
    const uploadsAssemblies = Object.assign({},
      state.uploadsAssemblies,
      { [uploadID]: [] })
    this.setPluginState({ uploadsAssemblies })

    let optionsPromise
    if (fileIDs.length > 0) {
      optionsPromise = this.getAssemblyOptions(fileIDs)
        .then((allOptions) => this.dedupeAssemblyOptions(allOptions))
    } else if (this.opts.alwaysRunAssembly) {
      optionsPromise = Promise.resolve(
        this.opts.getAssemblyOptions(null, this.opts)
      ).then((options) => {
        this.validateParams(options.params)
        return [
          { fileIDs, options }
        ]
      })
    } else {
      // If there are no files and we do not `alwaysRunAssembly`,
      // don't do anything.
      return Promise.resolve()
    }

    return optionsPromise.then((assemblies) => Promise.all(
      assemblies.map(createAssembly)
    ))
  }

  afterUpload (fileIDs, uploadID) {
    // Only use files without errors
    fileIDs = fileIDs.filter((file) => !file.error)

    const state = this.getPluginState()
    // const state = this.getPluginState()
    // If we're still restoring state, wait for that to be done.
    if (this.restored) {
      return this.restored.then(() => {
        return this.afterUpload(fileIDs, uploadID)
      })
    }

    const assemblyIDs = state.uploadsAssemblies[uploadID]

    // If we don't have to wait for encoding metadata or results, we can close
    // the socket immediately and finish the upload.
    if (!this.shouldWait()) {
      assemblyIDs.forEach((assemblyID) => {
        const socket = this.sockets[assemblyID]
        socket.close()
      })
      return Promise.resolve()
    }

    // If no assemblies were created for this upload, we also do not have to wait.
    // There's also no sockets or anything to close, so just return immediately.
    if (assemblyIDs.length === 0) {
      return Promise.resolve()
    }

    let finishedAssemblies = 0

    return new Promise((resolve, reject) => {
      fileIDs.forEach((fileID) => {
        this.uppy.emit('postprocess-progress', fileID, {
          mode: 'indeterminate',
          message: this.i18n('encoding')
        })
      })

      const onAssemblyFinished = (assembly) => {
        // An assembly for a different upload just finished. We can ignore it.
        if (assemblyIDs.indexOf(assembly.assembly_id) === -1) {
          console.log('[Transloadit] afterUpload(): Ignoring finished assembly', assembly.assembly_id)
          return
        }
        console.log('[Transloadit] afterUpload(): Got assembly finish', assembly.assembly_id)

        // TODO set the `file.uploadURL` to a result?
        // We will probably need an option here so the plugin user can tell us
        // which result to pick…?

        const files = this.getAssemblyFiles(assembly.assembly_id)
        files.forEach((file) => {
          this.uppy.emit('postprocess-complete', file.id)
        })

        checkAllComplete()
      }

      const onAssemblyError = (assembly, error) => {
        // An assembly for a different upload just errored. We can ignore it.
        if (assemblyIDs.indexOf(assembly.assembly_id) === -1) {
          console.log('[Transloadit] afterUpload(): Ignoring errored assembly', assembly.assembly_id)
          return
        }
        console.log('[Transloadit] afterUpload(): Got assembly error', assembly.assembly_id, error)

        // Clear postprocessing state for all our files.
        const files = this.getAssemblyFiles(assembly.assembly_id)
        files.forEach((file) => {
          // TODO Maybe make a postprocess-error event here?
          this.uppy.emit('upload-error', file.id, error)

          this.uppy.emit('postprocess-complete', file.id)
        })

        checkAllComplete()
      }

      const onImportError = (assembly, fileID, error) => {
        if (assemblyIDs.indexOf(assembly.assembly_id) === -1) {
          return
        }

        // Not sure if we should be doing something when it's just one file failing.
        // ATM, the only options are 1) ignoring or 2) failing the entire upload.
        // I think failing the upload is better than silently ignoring.
        // In the future we should maybe have a way to resolve uploads with some failures,
        // like returning an object with `{ successful, failed }` uploads.
        onAssemblyError(assembly, error)
      }

      const checkAllComplete = () => {
        finishedAssemblies += 1
        if (finishedAssemblies === assemblyIDs.length) {
          // We're done, these listeners can be removed
          removeListeners()
          resolve()
        }
      }

      const removeListeners = () => {
        this.uppy.off('transloadit:complete', onAssemblyFinished)
        this.uppy.off('transloadit:assembly-error', onAssemblyError)
        this.uppy.off('transloadit:import-error', onImportError)
      }

      this.uppy.on('transloadit:complete', onAssemblyFinished)
      this.uppy.on('transloadit:assembly-error', onAssemblyError)
      this.uppy.on('transloadit:import-error', onImportError)
    }).then(() => {
      // Clean up uploadID → assemblyIDs, they're no longer going to be used anywhere.
      const state = this.getPluginState()
      const uploadsAssemblies = Object.assign({}, state.uploadsAssemblies)
      delete uploadsAssemblies[uploadID]
      this.setPluginState({ uploadsAssemblies })
    })
  }

  install () {
    this.uppy.addPreProcessor(this.prepareUpload)
    this.uppy.addPostProcessor(this.afterUpload)

    if (this.opts.importFromUploadURLs) {
      this.uppy.on('upload-success', this.onFileUploadURLAvailable)
    }

    this.core.on('restore:get-data', this.getPersistentData)
    this.core.on('core:restored', this.onRestored)

    this.setPluginState({
      // Contains assembly status objects, indexed by their ID.
      assemblies: {},
      // Contains arrays of assembly IDs, indexed by the upload ID that they belong to.
      uploadsAssemblies: {},
      // Contains file data from Transloadit, indexed by their Transloadit-assigned ID.
      files: {},
      // Contains result data from Transloadit.
      results: []
    })
  }

  uninstall () {
    this.uppy.removePreProcessor(this.prepareUpload)
    this.uppy.removePostProcessor(this.afterUpload)

    if (this.opts.importFromUploadURLs) {
      this.uppy.off('upload-success', this.onFileUploadURLAvailable)
    }
  }

  getAssembly (id) {
    const state = this.getPluginState()
    return state.assemblies[id]
  }

  getAssemblyFiles (assemblyID) {
    const fileIDs = Object.keys(this.uppy.state.files)
    return fileIDs.map((fileID) => {
      return this.uppy.getFile(fileID)
    }).filter((file) => {
      return file && file.transloadit && file.transloadit.assembly === assemblyID
    })
  }
}
