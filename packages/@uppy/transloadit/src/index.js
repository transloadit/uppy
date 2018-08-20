const Translator = require('@uppy/utils/lib/Translator')
const { Plugin } = require('@uppy/core')
const Tus = require('@uppy/tus')
const Assembly = require('./Assembly')
const Client = require('./Client')
const AssemblyOptions = require('./AssemblyOptions')

function defaultGetAssemblyOptions (file, options) {
  return {
    params: options.params,
    signature: options.signature,
    fields: options.fields
  }
}

const UPPY_SERVER = 'https://api2.transloadit.com/uppy-server'
// Regex used to check if an uppy-server address is run by Transloadit.
const TL_UPPY_SERVER = /https?:\/\/api2(?:-\w+)?\.transloadit\.com\/uppy-server/

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
        creatingAssemblyFailed: 'Transloadit: Could not create Assembly',
        encoding: 'Encoding...'
      }
    }

    const defaultOptions = {
      service: 'https://api2.transloadit.com',
      waitForEncoding: false,
      waitForMetadata: false,
      alwaysRunAssembly: false,
      importFromUploadURLs: false,
      signature: null,
      params: null,
      fields: {},
      getAssemblyOptions: defaultGetAssemblyOptions,
      locale: defaultLocale
    }

    this.opts = Object.assign({}, defaultOptions, opts)

    this.locale = Object.assign({}, defaultLocale, this.opts.locale)
    this.locale.strings = Object.assign({}, defaultLocale.strings, this.opts.locale.strings)

    this.translator = new Translator({ locale: this.locale })
    this.i18n = this.translator.translate.bind(this.translator)

    this.prepareUpload = this.prepareUpload.bind(this)
    this.afterUpload = this.afterUpload.bind(this)
    this.handleError = this.handleError.bind(this)
    this.onFileUploadURLAvailable = this.onFileUploadURLAvailable.bind(this)
    this.onRestored = this.onRestored.bind(this)
    this.getPersistentData = this.getPersistentData.bind(this)

    if (this.opts.params) {
      AssemblyOptions.validateParams(this.opts.params)
    }

    this.client = new Client({
      service: this.opts.service
    })
    // Contains Assembly instances for in-progress assemblies.
    this.activeAssemblies = {}
  }

  /**
   * Attach metadata to files to configure the Tus plugin to upload to Transloadit.
   * Also use Transloadit's uppy server
   *
   * See: https://github.com/tus/tusd/wiki/Uploading-to-Transloadit-using-tus#uploading-using-tus
   *
   * @param {Object} file
   * @param {Object} status
   */
  attachAssemblyMetadata (file, status) {
    // Add the metadata parameters Transloadit needs.
    const meta = {
      ...file.meta,
      assembly_url: status.assembly_url,
      filename: file.name,
      fieldname: 'file'
    }
    // Add assembly-specific Tus endpoint.
    const tus = {
      ...file.tus,
      endpoint: status.tus_url
    }

    // Set uppy server location. We only add this, if 'file' has the attribute
    // remote, because this is the criteria to identify remote files.
    // We only replace the hostname for Transloadit's uppy-servers, so that
    // people can also self-host them while still using Transloadit for encoding.
    let remote = file.remote
    if (file.remote && TL_UPPY_SERVER.test(file.remote.serverUrl)) {
      let newHost = status.uppyserver_url
        .replace(/\/$/, '')
      let path = file.remote.url
        .replace(file.remote.serverUrl, '')
        .replace(/^\//, '')

      remote = {
        ...file.remote,
        serverUrl: newHost,
        url: `${newHost}/${path}`
      }
    }

    // Store the assembly ID this file is in on the file under the `transloadit` key.
    const newFile = {
      ...file,
      transloadit: {
        assembly: status.assembly_id
      }
    }
    // Only configure the Tus plugin if we are uploading straight to Transloadit (the default).
    if (!this.opts.importFromUploadURLs) {
      Object.assign(newFile, { meta, tus, remote })
    }
    return newFile
  }

  createAssembly (fileIDs, uploadID, options) {
    this.uppy.log('[Transloadit] create Assembly')

    return this.client.createAssembly({
      params: options.params,
      fields: options.fields,
      expectedFiles: fileIDs.length,
      signature: options.signature
    }).then((newAssembly) => {
      const assembly = new Assembly(newAssembly)
      const status = assembly.status

      const { assemblies, uploadsAssemblies } = this.getPluginState()
      this.setPluginState({
        // Store the assembly status.
        assemblies: {
          ...assemblies,
          [status.assembly_id]: status
        },
        // Store the list of assemblies related to this upload.
        uploadsAssemblies: {
          ...uploadsAssemblies,
          [uploadID]: [
            ...uploadsAssemblies[uploadID],
            status.assembly_id
          ]
        }
      })

      const { files } = this.uppy.getState()
      const updatedFiles = {}
      fileIDs.forEach((id) => {
        updatedFiles[id] = this.attachAssemblyMetadata(this.uppy.getFile(id), status)
      })
      this.uppy.setState({
        files: {
          ...files,
          ...updatedFiles
        }
      })

      this.uppy.emit('transloadit:assembly-created', status, fileIDs)

      this.connectAssembly(assembly)

      this.uppy.log(`[Transloadit] Created Assembly ${assembly.assembly_id}`)
      return assembly
    }).catch((err) => {
      err.message = `${this.i18n('creatingAssemblyFailed')}: ${err.message}`

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
  onFileUploadURLAvailable (file) {
    if (!file || !file.transloadit || !file.transloadit.assembly) {
      return
    }

    const { assemblies } = this.getPluginState()
    const assembly = assemblies[file.transloadit.assembly]

    this.client.addFile(assembly, file).catch((err) => {
      this.uppy.log(err)
      this.uppy.emit('transloadit:import-error', assembly, file.id, err)
    })
  }

  findFile (uploadedFile) {
    const files = this.uppy.getFiles()
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      // Completed file upload.
      if (file.uploadURL === uploadedFile.tus_upload_url) {
        return file
      }
      // In-progress file upload.
      if (file.tus && file.tus.uploadUrl === uploadedFile.tus_upload_url) {
        return file
      }
      if (!uploadedFile.is_tus_file) {
        // Fingers-crossed check for non-tus uploads, eg imported from S3.
        if (file.name === uploadedFile.name && file.size === uploadedFile.size) {
          return file
        }
      }
    }
  }

  onFileUploadComplete (assemblyId, uploadedFile) {
    const state = this.getPluginState()
    const file = this.findFile(uploadedFile)
    if (!file) {
      this.uppy.log('[Transloadit] Couldn’t file the file, it was likely removed in the process')
      return
    }
    this.setPluginState({
      files: Object.assign({}, state.files, {
        [uploadedFile.id]: {
          assembly: assemblyId,
          id: file.id,
          uploadedFile
        }
      })
    })
    this.uppy.emit('transloadit:upload', uploadedFile, this.getAssembly(assemblyId))
  }

  /**
   * Callback when a new assembly result comes in.
   *
   * @param {string} assemblyId
   * @param {string} stepName
   * @param {Object} result
   */
  onResult (assemblyId, stepName, result) {
    const state = this.getPluginState()
    const file = state.files[result.original_id]
    // The `file` may not exist if an import robot was used instead of a file upload.
    result.localId = file ? file.id : null

    const entry = {
      result,
      stepName,
      id: result.id,
      assembly: assemblyId
    }

    this.setPluginState({
      results: [...state.results, entry]
    })
    this.uppy.emit('transloadit:result', stepName, result, this.getAssembly(assemblyId))
  }

  /**
   * When an assembly has finished processing, get the final state
   * and emit it.
   *
   * @param {Object} status
   */
  onAssemblyFinished (status) {
    const url = status.assembly_ssl_url
    this.client.getAssemblyStatus(url).then((finalStatus) => {
      const state = this.getPluginState()
      this.setPluginState({
        assemblies: Object.assign({}, state.assemblies, {
          [finalStatus.assembly_id]: finalStatus
        })
      })
      this.uppy.emit('transloadit:complete', finalStatus)
    })
  }

  /**
   * Custom state serialization for the Golden Retriever plugin.
   * It will pass this back to the `onRestored` function.
   *
   * @param {function} setData
   */
  getPersistentData (setData) {
    const state = this.getPluginState()
    const assemblies = state.assemblies
    const uploadsAssemblies = state.uploadsAssemblies

    setData({
      [this.id]: {
        assemblies,
        uploadsAssemblies
      }
    })
  }

  onRestored (pluginData) {
    const savedState = pluginData && pluginData[this.id] ? pluginData[this.id] : {}
    const previousAssemblies = savedState.assemblies || {}
    const uploadsAssemblies = savedState.uploadsAssemblies || {}

    if (Object.keys(uploadsAssemblies).length === 0) {
      // Nothing to restore.
      return
    }

    // Convert loaded assembly statuses to a Transloadit plugin state object.
    const restoreState = (assemblies) => {
      const files = {}
      const results = []
      Object.keys(assemblies).forEach((id) => {
        const status = assemblies[id]

        status.uploads.forEach((uploadedFile) => {
          const file = this.findFile(uploadedFile)
          files[uploadedFile.id] = {
            id: file.id,
            assembly: id,
            uploadedFile
          }
        })

        const state = this.getPluginState()
        Object.keys(status.results).forEach((stepName) => {
          status.results[stepName].forEach((result) => {
            const file = state.files[result.original_id]
            result.localId = file ? file.id : null
            results.push({
              id: result.id,
              result,
              stepName,
              assembly: id
            })
          })
        })
      })

      this.setPluginState({
        assemblies,
        files,
        results,
        uploadsAssemblies
      })
    }

    // Set up the Assembly instances for existing assemblies.
    const restoreAssemblies = () => {
      const { assemblies } = this.getPluginState()
      Object.keys(assemblies).forEach((id) => {
        const assembly = new Assembly(assemblies[id])
        this.connectAssembly(assembly)
      })
    }

    // Force-update all assemblies to check for missed events.
    const updateAssemblies = () => {
      const { assemblies } = this.getPluginState()
      return Promise.all(
        Object.keys(assemblies).map((id) => {
          return this.activeAssemblies[id].update()
        })
      )
    }

    // Restore all assembly state.
    this.restored = Promise.resolve().then(() => {
      restoreState(previousAssemblies)
      restoreAssemblies()
      return updateAssemblies()
    })

    this.restored.then(() => {
      this.restored = null
    })
  }

  connectAssembly (assembly) {
    const { status } = assembly
    const id = status.assembly_id
    this.activeAssemblies[id] = assembly

    // Sync local `assemblies` state
    assembly.on('status', (newStatus) => {
      const { assemblies } = this.getPluginState()
      this.setPluginState({
        assemblies: {
          ...assemblies,
          [id]: newStatus
        }
      })
    })

    assembly.on('upload', this.onFileUploadComplete.bind(this, id))
    assembly.on('error', (error) => {
      this.uppy.emit('transloadit:assembly-error', assembly.status, error)
    })

    assembly.on('executing', () => {
      this.uppy.emit('transloadit:assembly-executing', assembly.status)
    })

    if (this.opts.waitForEncoding) {
      assembly.on('result', this.onResult.bind(this, id))
    }

    if (this.opts.waitForEncoding) {
      assembly.on('finished', () => {
        this.onAssemblyFinished(assembly.status)
      })
    } else if (this.opts.waitForMetadata) {
      assembly.on('metadata', () => {
        this.onAssemblyFinished(assembly.status)
      })
    }

    // No need to connect to the socket if the assembly has completed by now.
    if (assembly.ok === 'ASSEMBLY_COMPLETE') {
      return assembly
    }

    // TODO Do we still need this for anything…?
    // eslint-disable-next-line no-unused-vars
    const connected = new Promise((resolve, reject) => {
      assembly.once('connect', resolve)
      assembly.once('status', resolve)
      assembly.once('error', reject)
    }).then(() => {
      this.uppy.log('[Transloadit] Socket is ready')
    })

    assembly.connect()
    return assembly
  }

  prepareUpload (fileIDs, uploadID) {
    // Only use files without errors
    fileIDs = fileIDs.filter((file) => !file.error)

    fileIDs.forEach((fileID) => {
      const file = this.uppy.getFile(fileID)
      this.uppy.emit('preprocess-progress', file, {
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
          const file = this.uppy.getFile(fileID)
          this.uppy.emit('preprocess-complete', file)
        })
      }).catch((err) => {
        // Clear preprocessing state when the assembly could not be created,
        // otherwise the UI gets confused about the lingering progress keys
        fileIDs.forEach((fileID) => {
          const file = this.uppy.getFile(fileID)
          this.uppy.emit('preprocess-complete', file)
          this.uppy.emit('upload-error', file, err)
        })
        throw err
      })
    }

    const { uploadsAssemblies } = this.getPluginState()
    this.setPluginState({
      uploadsAssemblies: {
        ...uploadsAssemblies,
        [uploadID]: []
      }
    })

    const files = fileIDs.map((id) => this.uppy.getFile(id))
    const assemblyOptions = new AssemblyOptions(files, this.opts)

    return assemblyOptions.build().then(
      (assemblies) => Promise.all(
        assemblies.map(createAssembly)
      ),
      // If something went wrong before any assemblies could be created,
      // clear all processing state.
      (err) => {
        fileIDs.forEach((fileID) => {
          const file = this.uppy.getFile(fileID)
          this.uppy.emit('preprocess-complete', file)
          this.uppy.emit('upload-error', file, err)
        })
        throw err
      }
    )
  }

  afterUpload (fileIDs, uploadID) {
    // Only use files without errors
    fileIDs = fileIDs.filter((file) => !file.error)

    const state = this.getPluginState()

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
        const assembly = this.activeAssemblies[assemblyID]
        assembly.close()
      })
      const assemblies = assemblyIDs.map((id) => this.getAssembly(id))
      this.uppy.addResultData(uploadID, { transloadit: assemblies })
      return Promise.resolve()
    }

    // If no assemblies were created for this upload, we also do not have to wait.
    // There's also no sockets or anything to close, so just return immediately.
    if (assemblyIDs.length === 0) {
      this.uppy.addResultData(uploadID, { transloadit: [] })
      return Promise.resolve()
    }

    let finishedAssemblies = 0

    return new Promise((resolve, reject) => {
      fileIDs.forEach((fileID) => {
        const file = this.uppy.getFile(fileID)
        this.uppy.emit('postprocess-progress', file, {
          mode: 'indeterminate',
          message: this.i18n('encoding')
        })
      })

      const onAssemblyFinished = (assembly) => {
        // An assembly for a different upload just finished. We can ignore it.
        if (assemblyIDs.indexOf(assembly.assembly_id) === -1) {
          this.uppy.log(`[Transloadit] afterUpload(): Ignoring finished Assembly ${assembly.assembly_id}`)
          return
        }
        this.uppy.log(`[Transloadit] afterUpload(): Got Assembly finish ${assembly.assembly_id}`)

        // TODO set the `file.uploadURL` to a result?
        // We will probably need an option here so the plugin user can tell us
        // which result to pick…?

        const files = this.getAssemblyFiles(assembly.assembly_id)
        files.forEach((file) => {
          this.uppy.emit('postprocess-complete', file)
        })

        checkAllComplete()
      }

      const onAssemblyError = (assembly, error) => {
        // An assembly for a different upload just errored. We can ignore it.
        if (assemblyIDs.indexOf(assembly.assembly_id) === -1) {
          this.uppy.log(`[Transloadit] afterUpload(): Ignoring errored Assembly ${assembly.assembly_id}`)
          return
        }
        this.uppy.log(`[Transloadit] afterUpload(): Got Assembly error ${assembly.assembly_id}`)
        this.uppy.log(error)
        // this.uppy.info({
        //   message: error.code,
        //   details: error.status.reason
        // }, 'error', 5000)

        // Clear postprocessing state for all our files.
        const files = this.getAssemblyFiles(assembly.assembly_id)
        files.forEach((file) => {
          // TODO Maybe make a postprocess-error event here?
          this.uppy.emit('upload-error', file, error)

          this.uppy.emit('postprocess-complete', file)
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
          const assemblies = assemblyIDs.map((id) => this.getAssembly(id))
          this.uppy.addResultData(uploadID, { transloadit: assemblies })
          resolve()
        }
      }

      const removeListeners = () => {
        this.uppy.off('transloadit:complete', onAssemblyFinished)
        this.uppy.off('transloadit:assembly-error', onAssemblyError)
        this.uppy.off('transloadit:import-error', onImportError)
      }

      // TODO Move these handlers up
      // They can also fire during the upload, especially when restoring
      this.uppy.on('transloadit:complete', onAssemblyFinished)
      this.uppy.on('transloadit:assembly-error', onAssemblyError)
      this.uppy.on('transloadit:import-error', onImportError)
    }).then((result) => {
      // Clean up uploadID → assemblyIDs, they're no longer going to be used anywhere.
      const state = this.getPluginState()
      const uploadsAssemblies = Object.assign({}, state.uploadsAssemblies)
      delete uploadsAssemblies[uploadID]
      this.setPluginState({ uploadsAssemblies })

      return result
    })
  }

  handleError (err, uploadID) {
    this.uppy.log('[Transloadit] handleError')
    this.uppy.log(err)
    this.uppy.log(uploadID)
    const state = this.getPluginState()
    const assemblyIDs = state.uploadsAssemblies[uploadID]

    assemblyIDs.forEach((assemblyID) => {
      if (this.activeAssemblies[assemblyID]) {
        this.activeAssemblies[assemblyID].close()
      }
    })
  }

  install () {
    this.uppy.addPreProcessor(this.prepareUpload)
    this.uppy.addPostProcessor(this.afterUpload)

    // We may need to close socket.io connections on error.
    this.uppy.on('error', this.handleError)

    if (this.opts.importFromUploadURLs) {
      // No uploader needed when importing; instead we take the upload URL from an existing uploader.
      this.uppy.on('upload-success', this.onFileUploadURLAvailable)
    } else {
      this.uppy.use(Tus, {
        // Disable tus-js-client fingerprinting, otherwise uploading the same file at different times
        // will upload to the same assembly.
        resume: false,
        // Disable Uppy Server's retry optimisation; we need to change the endpoint on retry
        // so it can't just reuse the same tus.Upload instance server-side.
        useFastRemoteRetry: false,
        // Only send assembly metadata to the tus endpoint.
        metaFields: ['assembly_url', 'filename', 'fieldname']
      })
    }

    this.uppy.on('restore:get-data', this.getPersistentData)
    this.uppy.on('restored', this.onRestored)

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
    this.uppy.off('error', this.handleError)

    if (this.opts.importFromUploadURLs) {
      this.uppy.off('upload-success', this.onFileUploadURLAvailable)
    }
  }

  getAssembly (id) {
    const state = this.getPluginState()
    return state.assemblies[id]
  }

  getAssemblyFiles (assemblyID) {
    return this.uppy.getFiles().filter((file) => {
      return file && file.transloadit && file.transloadit.assembly === assemblyID
    })
  }
}

module.exports.UPPY_SERVER = UPPY_SERVER
