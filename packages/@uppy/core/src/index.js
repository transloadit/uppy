const Translator = require('@uppy/utils/lib/Translator')
const ee = require('namespace-emitter')
const cuid = require('cuid')
const throttle = require('lodash.throttle')
const prettierBytes = require('@transloadit/prettier-bytes')
const match = require('mime-match')
const DefaultStore = require('@uppy/store-default')
const getFileType = require('@uppy/utils/lib/getFileType')
const getFileNameAndExtension = require('@uppy/utils/lib/getFileNameAndExtension')
const generateFileID = require('@uppy/utils/lib/generateFileID')
const supportsUploadProgress = require('./supportsUploadProgress')
const { justErrorsLogger, debugLogger } = require('./loggers')
const Plugin = require('./Plugin') // Exported from here.

class RestrictionError extends Error {
  constructor (...args) {
    super(...args)
    this.isRestriction = true
  }
}

/**
 * Uppy Core module.
 * Manages plugins, state updates, acts as an event bus,
 * adds/removes files and metadata.
 */
class Uppy {
  static VERSION = require('../package.json').version

  /**
   * Instantiate Uppy
   *
   * @param {object} opts — Uppy options
   */
  constructor (opts) {
    this.defaultLocale = {
      strings: {
        addBulkFilesFailed: {
          0: 'Failed to add %{smart_count} file due to an internal error',
          1: 'Failed to add %{smart_count} files due to internal errors'
        },
        youCanOnlyUploadX: {
          0: 'You can only upload %{smart_count} file',
          1: 'You can only upload %{smart_count} files'
        },
        youHaveToAtLeastSelectX: {
          0: 'You have to select at least %{smart_count} file',
          1: 'You have to select at least %{smart_count} files'
        },
        // The default `exceedsSize2` string only combines the `exceedsSize` string (%{backwardsCompat}) with the size.
        // Locales can override `exceedsSize2` to specify a different word order. This is for backwards compat with
        // Uppy 1.9.x and below which did a naive concatenation of `exceedsSize2 + size` instead of using a locale-specific
        // substitution.
        // TODO: In 2.0 `exceedsSize2` should be removed in and `exceedsSize` updated to use substitution.
        exceedsSize2: '%{backwardsCompat} %{size}',
        exceedsSize: 'This file exceeds maximum allowed size of',
        inferiorSize: 'This file is smaller than the allowed size of %{size}',
        youCanOnlyUploadFileTypes: 'You can only upload: %{types}',
        noNewAlreadyUploading: 'Cannot add new files: already uploading',
        noDuplicates: 'Cannot add the duplicate file \'%{fileName}\', it already exists',
        companionError: 'Connection with Companion failed',
        companionUnauthorizeHint: 'To unauthorize to your %{provider} account, please go to %{url}',
        failedToUpload: 'Failed to upload %{file}',
        noInternetConnection: 'No Internet connection',
        connectedToInternet: 'Connected to the Internet',
        // Strings for remote providers
        noFilesFound: 'You have no files or folders here',
        selectX: {
          0: 'Select %{smart_count}',
          1: 'Select %{smart_count}'
        },
        selectAllFilesFromFolderNamed: 'Select all files from folder %{name}',
        unselectAllFilesFromFolderNamed: 'Unselect all files from folder %{name}',
        selectFileNamed: 'Select file %{name}',
        unselectFileNamed: 'Unselect file %{name}',
        openFolderNamed: 'Open folder %{name}',
        cancel: 'Cancel',
        logOut: 'Log out',
        filter: 'Filter',
        resetFilter: 'Reset filter',
        loading: 'Loading...',
        authenticateWithTitle: 'Please authenticate with %{pluginName} to select files',
        authenticateWith: 'Connect to %{pluginName}',
        searchImages: 'Search for images',
        enterTextToSearch: 'Enter text to search for images',
        backToSearch: 'Back to Search',
        emptyFolderAdded: 'No files were added from empty folder',
        folderAdded: {
          0: 'Added %{smart_count} file from %{folder}',
          1: 'Added %{smart_count} files from %{folder}'
        }
      }
    }

    const defaultOptions = {
      id: 'uppy',
      autoProceed: false,
      allowMultipleUploads: true,
      debug: false,
      restrictions: {
        maxFileSize: null,
        minFileSize: null,
        maxTotalFileSize: null,
        maxNumberOfFiles: null,
        minNumberOfFiles: null,
        allowedFileTypes: null
      },
      meta: {},
      onBeforeFileAdded: (currentFile, files) => currentFile,
      onBeforeUpload: (files) => files,
      store: DefaultStore(),
      logger: justErrorsLogger,
      infoTimeout: 5000
    }

    // Merge default options with the ones set by user,
    // making sure to merge restrictions too
    this.opts = {
      ...defaultOptions,
      ...opts,
      restrictions: {
        ...defaultOptions.restrictions,
        ...(opts && opts.restrictions)
      }
    }

    // Support debug: true for backwards-compatability, unless logger is set in opts
    // opts instead of this.opts to avoid comparing objects — we set logger: justErrorsLogger in defaultOptions
    if (opts && opts.logger && opts.debug) {
      this.log('You are using a custom `logger`, but also set `debug: true`, which uses built-in logger to output logs to console. Ignoring `debug: true` and using your custom `logger`.', 'warning')
    } else if (opts && opts.debug) {
      this.opts.logger = debugLogger
    }

    this.log(`Using Core v${this.constructor.VERSION}`)

    if (this.opts.restrictions.allowedFileTypes &&
        this.opts.restrictions.allowedFileTypes !== null &&
        !Array.isArray(this.opts.restrictions.allowedFileTypes)) {
      throw new TypeError('`restrictions.allowedFileTypes` must be an array')
    }

    this.i18nInit()

    // Container for different types of plugins
    this.plugins = {}

    this.getState = this.getState.bind(this)
    this.getPlugin = this.getPlugin.bind(this)
    this.setFileMeta = this.setFileMeta.bind(this)
    this.setFileState = this.setFileState.bind(this)
    this.log = this.log.bind(this)
    this.info = this.info.bind(this)
    this.hideInfo = this.hideInfo.bind(this)
    this.addFile = this.addFile.bind(this)
    this.removeFile = this.removeFile.bind(this)
    this.pauseResume = this.pauseResume.bind(this)
    this.validateRestrictions = this.validateRestrictions.bind(this)

    // ___Why throttle at 500ms?
    //    - We must throttle at >250ms for superfocus in Dashboard to work well (because animation takes 0.25s, and we want to wait for all animations to be over before refocusing).
    //    [Practical Check]: if thottle is at 100ms, then if you are uploading a file, and click 'ADD MORE FILES', - focus won't activate in Firefox.
    //    - We must throttle at around >500ms to avoid performance lags.
    //    [Practical Check] Firefox, try to upload a big file for a prolonged period of time. Laptop will start to heat up.
    this._calculateProgress = throttle(this._calculateProgress.bind(this), 500, { leading: true, trailing: true })

    this.updateOnlineStatus = this.updateOnlineStatus.bind(this)
    this.resetProgress = this.resetProgress.bind(this)

    this.pauseAll = this.pauseAll.bind(this)
    this.resumeAll = this.resumeAll.bind(this)
    this.retryAll = this.retryAll.bind(this)
    this.cancelAll = this.cancelAll.bind(this)
    this.retryUpload = this.retryUpload.bind(this)
    this.upload = this.upload.bind(this)

    this.emitter = ee()
    this.on = this.on.bind(this)
    this.off = this.off.bind(this)
    this.once = this.emitter.once.bind(this.emitter)
    this.emit = this.emitter.emit.bind(this.emitter)

    this.preProcessors = []
    this.uploaders = []
    this.postProcessors = []

    this.store = this.opts.store
    this.setState({
      plugins: {},
      files: {},
      currentUploads: {},
      allowNewUpload: true,
      capabilities: {
        uploadProgress: supportsUploadProgress(),
        individualCancellation: true,
        resumableUploads: false
      },
      totalProgress: 0,
      meta: { ...this.opts.meta },
      info: {
        isHidden: true,
        type: 'info',
        message: ''
      }
    })

    this._storeUnsubscribe = this.store.subscribe((prevState, nextState, patch) => {
      this.emit('state-update', prevState, nextState, patch)
      this.updateAll(nextState)
    })

    // Exposing uppy object on window for debugging and testing
    if (this.opts.debug && typeof window !== 'undefined') {
      window[this.opts.id] = this
    }

    this._addListeners()

    // Re-enable if we’ll need some capabilities on boot, like isMobileDevice
    // this._setCapabilities()
  }

  // _setCapabilities = () => {
  //   const capabilities = {
  //     isMobileDevice: isMobileDevice()
  //   }

  //   this.setState({
  //     ...this.getState().capabilities,
  //     capabilities
  //   })
  // }

  on (event, callback) {
    this.emitter.on(event, callback)
    return this
  }

  off (event, callback) {
    this.emitter.off(event, callback)
    return this
  }

  /**
   * Iterate on all plugins and run `update` on them.
   * Called each time state changes.
   *
   */
  updateAll (state) {
    this.iteratePlugins(plugin => {
      plugin.update(state)
    })
  }

  /**
   * Updates state with a patch
   *
   * @param {object} patch {foo: 'bar'}
   */
  setState (patch) {
    this.store.setState(patch)
  }

  /**
   * Returns current state.
   *
   * @returns {object}
   */
  getState () {
    return this.store.getState()
  }

  /**
   * Back compat for when uppy.state is used instead of uppy.getState().
   */
  get state () {
    return this.getState()
  }

  /**
   * Shorthand to set state for a specific file.
   */
  setFileState (fileID, state) {
    if (!this.getState().files[fileID]) {
      throw new Error(`Can’t set state for ${fileID} (the file could have been removed)`)
    }

    this.setState({
      files: Object.assign({}, this.getState().files, {
        [fileID]: Object.assign({}, this.getState().files[fileID], state)
      })
    })
  }

  i18nInit () {
    this.translator = new Translator([this.defaultLocale, this.opts.locale])
    this.locale = this.translator.locale
    this.i18n = this.translator.translate.bind(this.translator)
    this.i18nArray = this.translator.translateArray.bind(this.translator)
  }

  setOptions (newOpts) {
    this.opts = {
      ...this.opts,
      ...newOpts,
      restrictions: {
        ...this.opts.restrictions,
        ...(newOpts && newOpts.restrictions)
      }
    }

    if (newOpts.meta) {
      this.setMeta(newOpts.meta)
    }

    this.i18nInit()

    if (newOpts.locale) {
      this.iteratePlugins((plugin) => {
        plugin.setOptions()
      })
    }

    this.setState() // so that UI re-renders with new options
  }

  resetProgress () {
    const defaultProgress = {
      percentage: 0,
      bytesUploaded: 0,
      uploadComplete: false,
      uploadStarted: null
    }
    const files = Object.assign({}, this.getState().files)
    const updatedFiles = {}
    Object.keys(files).forEach(fileID => {
      const updatedFile = Object.assign({}, files[fileID])
      updatedFile.progress = Object.assign({}, updatedFile.progress, defaultProgress)
      updatedFiles[fileID] = updatedFile
    })

    this.setState({
      files: updatedFiles,
      totalProgress: 0
    })

    this.emit('reset-progress')
  }

  addPreProcessor (fn) {
    this.preProcessors.push(fn)
  }

  removePreProcessor (fn) {
    const i = this.preProcessors.indexOf(fn)
    if (i !== -1) {
      this.preProcessors.splice(i, 1)
    }
  }

  addPostProcessor (fn) {
    this.postProcessors.push(fn)
  }

  removePostProcessor (fn) {
    const i = this.postProcessors.indexOf(fn)
    if (i !== -1) {
      this.postProcessors.splice(i, 1)
    }
  }

  addUploader (fn) {
    this.uploaders.push(fn)
  }

  removeUploader (fn) {
    const i = this.uploaders.indexOf(fn)
    if (i !== -1) {
      this.uploaders.splice(i, 1)
    }
  }

  setMeta (data) {
    const updatedMeta = Object.assign({}, this.getState().meta, data)
    const updatedFiles = Object.assign({}, this.getState().files)

    Object.keys(updatedFiles).forEach((fileID) => {
      updatedFiles[fileID] = Object.assign({}, updatedFiles[fileID], {
        meta: Object.assign({}, updatedFiles[fileID].meta, data)
      })
    })

    this.log('Adding metadata:')
    this.log(data)

    this.setState({
      meta: updatedMeta,
      files: updatedFiles
    })
  }

  setFileMeta (fileID, data) {
    const updatedFiles = Object.assign({}, this.getState().files)
    if (!updatedFiles[fileID]) {
      this.log('Was trying to set metadata for a file that has been removed: ', fileID)
      return
    }
    const newMeta = Object.assign({}, updatedFiles[fileID].meta, data)
    updatedFiles[fileID] = Object.assign({}, updatedFiles[fileID], {
      meta: newMeta
    })
    this.setState({ files: updatedFiles })
  }

  /**
   * Get a file object.
   *
   * @param {string} fileID The ID of the file object to return.
   */
  getFile (fileID) {
    return this.getState().files[fileID]
  }

  /**
   * Get all files in an array.
   */
  getFiles () {
    const { files } = this.getState()
    return Object.keys(files).map((fileID) => files[fileID])
  }

  /**
   * A public wrapper for _checkRestrictions — checks if a file passes a set of restrictions.
   * For use in UI pluigins (like Providers), to disallow selecting files that won’t pass restrictions.
   *
   * @param {object} file object to check
   * @param {Array} [files] array to check maxNumberOfFiles and maxTotalFileSize
   * @returns {object} { result: true/false, reason: why file didn’t pass restrictions }
   */
  validateRestrictions (file, files) {
    try {
      this._checkRestrictions(file, files)
      return {
        result: true
      }
    } catch (err) {
      return {
        result: false,
        reason: err.message
      }
    }
  }

  /**
   * Check if file passes a set of restrictions set in options: maxFileSize, minFileSize,
   * maxNumberOfFiles and allowedFileTypes.
   *
   * @param {object} file object to check
   * @param {Array} [files] array to check maxNumberOfFiles and maxTotalFileSize
   * @private
   */
  _checkRestrictions (file, files = this.getFiles()) {
    const { maxFileSize, minFileSize, maxTotalFileSize, maxNumberOfFiles, allowedFileTypes } = this.opts.restrictions

    if (maxNumberOfFiles) {
      if (files.length + 1 > maxNumberOfFiles) {
        throw new RestrictionError(`${this.i18n('youCanOnlyUploadX', { smart_count: maxNumberOfFiles })}`)
      }
    }

    if (allowedFileTypes) {
      const isCorrectFileType = allowedFileTypes.some((type) => {
        // check if this is a mime-type
        if (type.indexOf('/') > -1) {
          if (!file.type) return false
          return match(file.type.replace(/;.*?$/, ''), type)
        }

        // otherwise this is likely an extension
        if (type[0] === '.' && file.extension) {
          return file.extension.toLowerCase() === type.substr(1).toLowerCase()
        }
        return false
      })

      if (!isCorrectFileType) {
        const allowedFileTypesString = allowedFileTypes.join(', ')
        throw new RestrictionError(this.i18n('youCanOnlyUploadFileTypes', { types: allowedFileTypesString }))
      }
    }

    // We can't check maxTotalFileSize if the size is unknown.
    if (maxTotalFileSize && file.size != null) {
      let totalFilesSize = 0
      totalFilesSize += file.size
      files.forEach((file) => {
        totalFilesSize += file.size
      })
      if (totalFilesSize > maxTotalFileSize) {
        throw new RestrictionError(this.i18n('exceedsSize2', {
          backwardsCompat: this.i18n('exceedsSize'),
          size: prettierBytes(maxTotalFileSize)
        }))
      }
    }

    // We can't check maxFileSize if the size is unknown.
    if (maxFileSize && file.size != null) {
      if (file.size > maxFileSize) {
        throw new RestrictionError(this.i18n('exceedsSize2', {
          backwardsCompat: this.i18n('exceedsSize'),
          size: prettierBytes(maxFileSize)
        }))
      }
    }

    // We can't check minFileSize if the size is unknown.
    if (minFileSize && file.size != null) {
      if (file.size < minFileSize) {
        throw new RestrictionError(this.i18n('inferiorSize', {
          size: prettierBytes(minFileSize)
        }))
      }
    }
  }

  /**
   * Check if minNumberOfFiles restriction is reached before uploading.
   *
   * @private
   */
  _checkMinNumberOfFiles (files) {
    const { minNumberOfFiles } = this.opts.restrictions
    if (Object.keys(files).length < minNumberOfFiles) {
      throw new RestrictionError(`${this.i18n('youHaveToAtLeastSelectX', { smart_count: minNumberOfFiles })}`)
    }
  }

  /**
   * Logs an error, sets Informer message, then throws the error.
   * Emits a 'restriction-failed' event if it’s a restriction error
   *
   * @param {object | string} err — Error object or plain string message
   * @param {object} [options]
   * @param {boolean} [options.showInformer=true] — Sometimes developer might want to show Informer manually
   * @param {object} [options.file=null] — File object used to emit the restriction error
   * @param {boolean} [options.throwErr=true] — Errors shouldn’t be thrown, for example, in `upload-error` event
   * @private
   */
  _showOrLogErrorAndThrow (err, { showInformer = true, file = null, throwErr = true } = {}) {
    const message = typeof err === 'object' ? err.message : err
    const details = (typeof err === 'object' && err.details) ? err.details : ''

    // Restriction errors should be logged, but not as errors,
    // as they are expected and shown in the UI.
    let logMessageWithDetails = message
    if (details) {
      logMessageWithDetails += ' ' + details
    }
    if (err.isRestriction) {
      this.log(logMessageWithDetails)
      this.emit('restriction-failed', file, err)
    } else {
      this.log(logMessageWithDetails, 'error')
    }

    // Sometimes informer has to be shown manually by the developer,
    // for example, in `onBeforeFileAdded`.
    if (showInformer) {
      this.info({ message: message, details: details }, 'error', this.opts.infoTimeout)
    }

    if (throwErr) {
      throw (typeof err === 'object' ? err : new Error(err))
    }
  }

  _assertNewUploadAllowed (file) {
    const { allowNewUpload } = this.getState()

    if (allowNewUpload === false) {
      this._showOrLogErrorAndThrow(new RestrictionError(this.i18n('noNewAlreadyUploading')), { file })
    }
  }

  /**
   * Create a file state object based on user-provided `addFile()` options.
   *
   * Note this is extremely side-effectful and should only be done when a file state object will be added to state immediately afterward!
   *
   * The `files` value is passed in because it may be updated by the caller without updating the store.
   */
  _checkAndCreateFileStateObject (files, file) {
    const fileType = getFileType(file)
    file.type = fileType

    const onBeforeFileAddedResult = this.opts.onBeforeFileAdded(file, files)

    if (onBeforeFileAddedResult === false) {
      // Don’t show UI info for this error, as it should be done by the developer
      this._showOrLogErrorAndThrow(new RestrictionError('Cannot add the file because onBeforeFileAdded returned false.'), { showInformer: false, file })
    }

    if (typeof onBeforeFileAddedResult === 'object' && onBeforeFileAddedResult) {
      file = onBeforeFileAddedResult
    }

    let fileName
    if (file.name) {
      fileName = file.name
    } else if (fileType.split('/')[0] === 'image') {
      fileName = fileType.split('/')[0] + '.' + fileType.split('/')[1]
    } else {
      fileName = 'noname'
    }
    const fileExtension = getFileNameAndExtension(fileName).extension
    const isRemote = file.isRemote || false

    const fileID = generateFileID(file)

    if (files[fileID]) {
      this._showOrLogErrorAndThrow(new RestrictionError(this.i18n('noDuplicates', { fileName })), { file })
    }

    const meta = file.meta || {}
    meta.name = fileName
    meta.type = fileType

    // `null` means the size is unknown.
    const size = isFinite(file.data.size) ? file.data.size : null
    const newFile = {
      source: file.source || '',
      id: fileID,
      name: fileName,
      extension: fileExtension || '',
      meta: {
        ...this.getState().meta,
        ...meta
      },
      type: fileType,
      data: file.data,
      progress: {
        percentage: 0,
        bytesUploaded: 0,
        bytesTotal: size,
        uploadComplete: false,
        uploadStarted: null
      },
      size: size,
      isRemote: isRemote,
      remote: file.remote || '',
      preview: file.preview
    }

    try {
      const filesArray = Object.keys(files).map(i => files[i])
      this._checkRestrictions(newFile, filesArray)
    } catch (err) {
      this._showOrLogErrorAndThrow(err, { file: newFile })
    }

    return newFile
  }

  // Schedule an upload if `autoProceed` is enabled.
  _startIfAutoProceed () {
    if (this.opts.autoProceed && !this.scheduledAutoProceed) {
      this.scheduledAutoProceed = setTimeout(() => {
        this.scheduledAutoProceed = null
        this.upload().catch((err) => {
          if (!err.isRestriction) {
            this.log(err.stack || err.message || err)
          }
        })
      }, 4)
    }
  }

  /**
   * Add a new file to `state.files`. This will run `onBeforeFileAdded`,
   * try to guess file type in a clever way, check file against restrictions,
   * and start an upload if `autoProceed === true`.
   *
   * @param {object} file object to add
   * @returns {string} id for the added file
   */
  addFile (file) {
    this._assertNewUploadAllowed(file)

    const { files } = this.getState()
    const newFile = this._checkAndCreateFileStateObject(files, file)

    this.setState({
      files: {
        ...files,
        [newFile.id]: newFile
      }
    })

    this.emit('file-added', newFile)
    this.emit('files-added', [newFile])
    this.log(`Added file: ${newFile.name}, ${newFile.id}, mime type: ${newFile.type}`)

    this._startIfAutoProceed()

    return newFile.id
  }

  /**
   * Add multiple files to `state.files`. See the `addFile()` documentation.
   *
   * This cuts some corners for performance, so should typically only be used in cases where there may be a lot of files.
   *
   * If an error occurs while adding a file, it is logged and the user is notified. This is good for UI plugins, but not for programmatic use. Programmatic users should usually still use `addFile()` on individual files.
   */
  addFiles (fileDescriptors) {
    this._assertNewUploadAllowed()

    // create a copy of the files object only once
    const files = { ...this.getState().files }
    const newFiles = []
    const errors = []
    for (let i = 0; i < fileDescriptors.length; i++) {
      try {
        const newFile = this._checkAndCreateFileStateObject(files, fileDescriptors[i])
        newFiles.push(newFile)
        files[newFile.id] = newFile
      } catch (err) {
        if (!err.isRestriction) {
          errors.push(err)
        }
      }
    }

    this.setState({ files })

    newFiles.forEach((newFile) => {
      this.emit('file-added', newFile)
    })

    this.emit('files-added', newFiles)

    if (newFiles.length > 5) {
      this.log(`Added batch of ${newFiles.length} files`)
    } else {
      Object.keys(newFiles).forEach(fileID => {
        this.log(`Added file: ${newFiles[fileID].name}\n id: ${newFiles[fileID].id}\n type: ${newFiles[fileID].type}`)
      })
    }

    if (newFiles.length > 0) {
      this._startIfAutoProceed()
    }

    if (errors.length > 0) {
      let message = 'Multiple errors occurred while adding files:\n'
      errors.forEach((subError) => {
        message += `\n * ${subError.message}`
      })

      this.info({
        message: this.i18n('addBulkFilesFailed', { smart_count: errors.length }),
        details: message
      }, 'error', this.opts.infoTimeout)

      const err = new Error(message)
      err.errors = errors
      throw err
    }
  }

  removeFiles (fileIDs, reason) {
    const { files, currentUploads } = this.getState()
    const updatedFiles = { ...files }
    const updatedUploads = { ...currentUploads }

    const removedFiles = Object.create(null)
    fileIDs.forEach((fileID) => {
      if (files[fileID]) {
        removedFiles[fileID] = files[fileID]
        delete updatedFiles[fileID]
      }
    })

    // Remove files from the `fileIDs` list in each upload.
    function fileIsNotRemoved (uploadFileID) {
      return removedFiles[uploadFileID] === undefined
    }
    const uploadsToRemove = []
    Object.keys(updatedUploads).forEach((uploadID) => {
      const newFileIDs = currentUploads[uploadID].fileIDs.filter(fileIsNotRemoved)

      // Remove the upload if no files are associated with it anymore.
      if (newFileIDs.length === 0) {
        uploadsToRemove.push(uploadID)
        return
      }

      updatedUploads[uploadID] = {
        ...currentUploads[uploadID],
        fileIDs: newFileIDs
      }
    })

    uploadsToRemove.forEach((uploadID) => {
      delete updatedUploads[uploadID]
    })

    const stateUpdate = {
      currentUploads: updatedUploads,
      files: updatedFiles
    }

    // If all files were removed - allow new uploads!
    if (Object.keys(updatedFiles).length === 0) {
      stateUpdate.allowNewUpload = true
      stateUpdate.error = null
    }

    this.setState(stateUpdate)
    this._calculateTotalProgress()

    const removedFileIDs = Object.keys(removedFiles)
    removedFileIDs.forEach((fileID) => {
      this.emit('file-removed', removedFiles[fileID], reason)
    })

    if (removedFileIDs.length > 5) {
      this.log(`Removed ${removedFileIDs.length} files`)
    } else {
      this.log(`Removed files: ${removedFileIDs.join(', ')}`)
    }
  }

  removeFile (fileID, reason = null) {
    this.removeFiles([fileID], reason)
  }

  pauseResume (fileID) {
    if (!this.getState().capabilities.resumableUploads ||
         this.getFile(fileID).uploadComplete) {
      return
    }

    const wasPaused = this.getFile(fileID).isPaused || false
    const isPaused = !wasPaused

    this.setFileState(fileID, {
      isPaused: isPaused
    })

    this.emit('upload-pause', fileID, isPaused)

    return isPaused
  }

  pauseAll () {
    const updatedFiles = Object.assign({}, this.getState().files)
    const inProgressUpdatedFiles = Object.keys(updatedFiles).filter((file) => {
      return !updatedFiles[file].progress.uploadComplete &&
             updatedFiles[file].progress.uploadStarted
    })

    inProgressUpdatedFiles.forEach((file) => {
      const updatedFile = Object.assign({}, updatedFiles[file], {
        isPaused: true
      })
      updatedFiles[file] = updatedFile
    })

    this.setState({ files: updatedFiles })
    this.emit('pause-all')
  }

  resumeAll () {
    const updatedFiles = Object.assign({}, this.getState().files)
    const inProgressUpdatedFiles = Object.keys(updatedFiles).filter((file) => {
      return !updatedFiles[file].progress.uploadComplete &&
             updatedFiles[file].progress.uploadStarted
    })

    inProgressUpdatedFiles.forEach((file) => {
      const updatedFile = Object.assign({}, updatedFiles[file], {
        isPaused: false,
        error: null
      })
      updatedFiles[file] = updatedFile
    })
    this.setState({ files: updatedFiles })

    this.emit('resume-all')
  }

  retryAll () {
    const updatedFiles = Object.assign({}, this.getState().files)
    const filesToRetry = Object.keys(updatedFiles).filter(file => {
      return updatedFiles[file].error
    })

    filesToRetry.forEach((file) => {
      const updatedFile = Object.assign({}, updatedFiles[file], {
        isPaused: false,
        error: null
      })
      updatedFiles[file] = updatedFile
    })
    this.setState({
      files: updatedFiles,
      error: null
    })

    this.emit('retry-all', filesToRetry)

    if (filesToRetry.length === 0) {
      return Promise.resolve({
        successful: [],
        failed: []
      })
    }

    const uploadID = this._createUpload(filesToRetry, {
      forceAllowNewUpload: true // create new upload even if allowNewUpload: false
    })
    return this._runUpload(uploadID)
  }

  cancelAll () {
    this.emit('cancel-all')

    const { files } = this.getState()

    const fileIDs = Object.keys(files)
    if (fileIDs.length) {
      this.removeFiles(fileIDs, 'cancel-all')
    }

    this.setState({
      totalProgress: 0,
      error: null
    })
  }

  retryUpload (fileID) {
    this.setFileState(fileID, {
      error: null,
      isPaused: false
    })

    this.emit('upload-retry', fileID)

    const uploadID = this._createUpload([fileID], {
      forceAllowNewUpload: true // create new upload even if allowNewUpload: false
    })
    return this._runUpload(uploadID)
  }

  reset () {
    this.cancelAll()
  }

  _calculateProgress (file, data) {
    if (!this.getFile(file.id)) {
      this.log(`Not setting progress for a file that has been removed: ${file.id}`)
      return
    }

    // bytesTotal may be null or zero; in that case we can't divide by it
    const canHavePercentage = isFinite(data.bytesTotal) && data.bytesTotal > 0
    this.setFileState(file.id, {
      progress: {
        ...this.getFile(file.id).progress,
        bytesUploaded: data.bytesUploaded,
        bytesTotal: data.bytesTotal,
        percentage: canHavePercentage
          // TODO(goto-bus-stop) flooring this should probably be the choice of the UI?
          // we get more accurate calculations if we don't round this at all.
          ? Math.round(data.bytesUploaded / data.bytesTotal * 100)
          : 0
      }
    })

    this._calculateTotalProgress()
  }

  _calculateTotalProgress () {
    // calculate total progress, using the number of files currently uploading,
    // multiplied by 100 and the summ of individual progress of each file
    const files = this.getFiles()

    const inProgress = files.filter((file) => {
      return file.progress.uploadStarted ||
        file.progress.preprocess ||
        file.progress.postprocess
    })

    if (inProgress.length === 0) {
      this.emit('progress', 0)
      this.setState({ totalProgress: 0 })
      return
    }

    const sizedFiles = inProgress.filter((file) => file.progress.bytesTotal != null)
    const unsizedFiles = inProgress.filter((file) => file.progress.bytesTotal == null)

    if (sizedFiles.length === 0) {
      const progressMax = inProgress.length * 100
      const currentProgress = unsizedFiles.reduce((acc, file) => {
        return acc + file.progress.percentage
      }, 0)
      const totalProgress = Math.round(currentProgress / progressMax * 100)
      this.setState({ totalProgress })
      return
    }

    let totalSize = sizedFiles.reduce((acc, file) => {
      return acc + file.progress.bytesTotal
    }, 0)
    const averageSize = totalSize / sizedFiles.length
    totalSize += averageSize * unsizedFiles.length

    let uploadedSize = 0
    sizedFiles.forEach((file) => {
      uploadedSize += file.progress.bytesUploaded
    })
    unsizedFiles.forEach((file) => {
      uploadedSize += averageSize * (file.progress.percentage || 0) / 100
    })

    let totalProgress = totalSize === 0
      ? 0
      : Math.round(uploadedSize / totalSize * 100)

    // hot fix, because:
    // uploadedSize ended up larger than totalSize, resulting in 1325% total
    if (totalProgress > 100) {
      totalProgress = 100
    }

    this.setState({ totalProgress })
    this.emit('progress', totalProgress)
  }

  /**
   * Registers listeners for all global actions, like:
   * `error`, `file-removed`, `upload-progress`
   */
  _addListeners () {
    this.on('error', (error) => {
      let errorMsg = 'Unknown error'
      if (error.message) {
        errorMsg = error.message
      }

      if (error.details) {
        errorMsg += ' ' + error.details
      }

      this.setState({ error: errorMsg })
    })

    this.on('upload-error', (file, error, response) => {
      let errorMsg = 'Unknown error'
      if (error.message) {
        errorMsg = error.message
      }

      if (error.details) {
        errorMsg += ' ' + error.details
      }

      this.setFileState(file.id, {
        error: errorMsg,
        response
      })

      this.setState({ error: error.message })

      if (typeof error === 'object' && error.message) {
        const newError = new Error(error.message)
        newError.details = error.message
        if (error.details) {
          newError.details += ' ' + error.details
        }
        newError.message = this.i18n('failedToUpload', { file: file.name })
        this._showOrLogErrorAndThrow(newError, {
          throwErr: false
        })
      } else {
        this._showOrLogErrorAndThrow(error, {
          throwErr: false
        })
      }
    })

    this.on('upload', () => {
      this.setState({ error: null })
    })

    this.on('upload-started', (file, upload) => {
      if (!this.getFile(file.id)) {
        this.log(`Not setting progress for a file that has been removed: ${file.id}`)
        return
      }
      this.setFileState(file.id, {
        progress: {
          uploadStarted: Date.now(),
          uploadComplete: false,
          percentage: 0,
          bytesUploaded: 0,
          bytesTotal: file.size
        }
      })
    })

    this.on('upload-progress', this._calculateProgress)

    this.on('upload-success', (file, uploadResp) => {
      if (!this.getFile(file.id)) {
        this.log(`Not setting progress for a file that has been removed: ${file.id}`)
        return
      }

      const currentProgress = this.getFile(file.id).progress
      this.setFileState(file.id, {
        progress: Object.assign({}, currentProgress, {
          postprocess: this.postProcessors.length > 0 ? {
            mode: 'indeterminate'
          } : null,
          uploadComplete: true,
          percentage: 100,
          bytesUploaded: currentProgress.bytesTotal
        }),
        response: uploadResp,
        uploadURL: uploadResp.uploadURL,
        isPaused: false
      })

      this._calculateTotalProgress()
    })

    this.on('preprocess-progress', (file, progress) => {
      if (!this.getFile(file.id)) {
        this.log(`Not setting progress for a file that has been removed: ${file.id}`)
        return
      }
      this.setFileState(file.id, {
        progress: Object.assign({}, this.getFile(file.id).progress, {
          preprocess: progress
        })
      })
    })

    this.on('preprocess-complete', (file) => {
      if (!this.getFile(file.id)) {
        this.log(`Not setting progress for a file that has been removed: ${file.id}`)
        return
      }
      const files = Object.assign({}, this.getState().files)
      files[file.id] = Object.assign({}, files[file.id], {
        progress: Object.assign({}, files[file.id].progress)
      })
      delete files[file.id].progress.preprocess

      this.setState({ files: files })
    })

    this.on('postprocess-progress', (file, progress) => {
      if (!this.getFile(file.id)) {
        this.log(`Not setting progress for a file that has been removed: ${file.id}`)
        return
      }
      this.setFileState(file.id, {
        progress: Object.assign({}, this.getState().files[file.id].progress, {
          postprocess: progress
        })
      })
    })

    this.on('postprocess-complete', (file) => {
      if (!this.getFile(file.id)) {
        this.log(`Not setting progress for a file that has been removed: ${file.id}`)
        return
      }
      const files = Object.assign({}, this.getState().files)
      files[file.id] = Object.assign({}, files[file.id], {
        progress: Object.assign({}, files[file.id].progress)
      })
      delete files[file.id].progress.postprocess
      // TODO should we set some kind of `fullyComplete` property on the file object
      // so it's easier to see that the file is upload…fully complete…rather than
      // what we have to do now (`uploadComplete && !postprocess`)

      this.setState({ files: files })
    })

    this.on('restored', () => {
      // Files may have changed--ensure progress is still accurate.
      this._calculateTotalProgress()
    })

    // show informer if offline
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('online', () => this.updateOnlineStatus())
      window.addEventListener('offline', () => this.updateOnlineStatus())
      setTimeout(() => this.updateOnlineStatus(), 3000)
    }
  }

  updateOnlineStatus () {
    const online =
      typeof window.navigator.onLine !== 'undefined'
        ? window.navigator.onLine
        : true
    if (!online) {
      this.emit('is-offline')
      this.info(this.i18n('noInternetConnection'), 'error', 0)
      this.wasOffline = true
    } else {
      this.emit('is-online')
      if (this.wasOffline) {
        this.emit('back-online')
        this.info(this.i18n('connectedToInternet'), 'success', 3000)
        this.wasOffline = false
      }
    }
  }

  getID () {
    return this.opts.id
  }

  /**
   * Registers a plugin with Core.
   *
   * @param {object} Plugin object
   * @param {object} [opts] object with options to be passed to Plugin
   * @returns {object} self for chaining
   */
  use (Plugin, opts) {
    if (typeof Plugin !== 'function') {
      const msg = `Expected a plugin class, but got ${Plugin === null ? 'null' : typeof Plugin}.` +
        ' Please verify that the plugin was imported and spelled correctly.'
      throw new TypeError(msg)
    }

    // Instantiate
    const plugin = new Plugin(this, opts)
    const pluginId = plugin.id
    this.plugins[plugin.type] = this.plugins[plugin.type] || []

    if (!pluginId) {
      throw new Error('Your plugin must have an id')
    }

    if (!plugin.type) {
      throw new Error('Your plugin must have a type')
    }

    const existsPluginAlready = this.getPlugin(pluginId)
    if (existsPluginAlready) {
      const msg = `Already found a plugin named '${existsPluginAlready.id}'. ` +
        `Tried to use: '${pluginId}'.\n` +
        'Uppy plugins must have unique `id` options. See https://uppy.io/docs/plugins/#id.'
      throw new Error(msg)
    }

    if (Plugin.VERSION) {
      this.log(`Using ${pluginId} v${Plugin.VERSION}`)
    }

    this.plugins[plugin.type].push(plugin)
    plugin.install()

    return this
  }

  /**
   * Find one Plugin by name.
   *
   * @param {string} id plugin id
   * @returns {object|boolean}
   */
  getPlugin (id) {
    let foundPlugin = null
    this.iteratePlugins((plugin) => {
      if (plugin.id === id) {
        foundPlugin = plugin
        return false
      }
    })
    return foundPlugin
  }

  /**
   * Iterate through all `use`d plugins.
   *
   * @param {Function} method that will be run on each plugin
   */
  iteratePlugins (method) {
    Object.keys(this.plugins).forEach(pluginType => {
      this.plugins[pluginType].forEach(method)
    })
  }

  /**
   * Uninstall and remove a plugin.
   *
   * @param {object} instance The plugin instance to remove.
   */
  removePlugin (instance) {
    this.log(`Removing plugin ${instance.id}`)
    this.emit('plugin-remove', instance)

    if (instance.uninstall) {
      instance.uninstall()
    }

    const list = this.plugins[instance.type].slice()
    const index = list.indexOf(instance)
    if (index !== -1) {
      list.splice(index, 1)
      this.plugins[instance.type] = list
    }

    const updatedState = this.getState()
    delete updatedState.plugins[instance.id]
    this.setState(updatedState)
  }

  /**
   * Uninstall all plugins and close down this Uppy instance.
   */
  close () {
    this.log(`Closing Uppy instance ${this.opts.id}: removing all files and uninstalling plugins`)

    this.reset()

    this._storeUnsubscribe()

    this.iteratePlugins((plugin) => {
      this.removePlugin(plugin)
    })
  }

  /**
   * Set info message in `state.info`, so that UI plugins like `Informer`
   * can display the message.
   *
   * @param {string | object} message Message to be displayed by the informer
   * @param {string} [type]
   * @param {number} [duration]
   */

  info (message, type = 'info', duration = 3000) {
    const isComplexMessage = typeof message === 'object'

    this.setState({
      info: {
        isHidden: false,
        type: type,
        message: isComplexMessage ? message.message : message,
        details: isComplexMessage ? message.details : null
      }
    })

    this.emit('info-visible')

    clearTimeout(this.infoTimeoutID)
    if (duration === 0) {
      this.infoTimeoutID = undefined
      return
    }

    // hide the informer after `duration` milliseconds
    this.infoTimeoutID = setTimeout(this.hideInfo, duration)
  }

  hideInfo () {
    const newInfo = Object.assign({}, this.getState().info, {
      isHidden: true
    })
    this.setState({
      info: newInfo
    })
    this.emit('info-hidden')
  }

  /**
   * Passes messages to a function, provided in `opts.logger`.
   * If `opts.logger: Uppy.debugLogger` or `opts.debug: true`, logs to the browser console.
   *
   * @param {string|object} message to log
   * @param {string} [type] optional `error` or `warning`
   */
  log (message, type) {
    const { logger } = this.opts
    switch (type) {
      case 'error': logger.error(message); break
      case 'warning': logger.warn(message); break
      default: logger.debug(message); break
    }
  }

  /**
   * Obsolete, event listeners are now added in the constructor.
   */
  run () {
    this.log('Calling run() is no longer necessary.', 'warning')
    return this
  }

  /**
   * Restore an upload by its ID.
   */
  restore (uploadID) {
    this.log(`Core: attempting to restore upload "${uploadID}"`)

    if (!this.getState().currentUploads[uploadID]) {
      this._removeUpload(uploadID)
      return Promise.reject(new Error('Nonexistent upload'))
    }

    return this._runUpload(uploadID)
  }

  /**
   * Create an upload for a bunch of files.
   *
   * @param {Array<string>} fileIDs File IDs to include in this upload.
   * @returns {string} ID of this upload.
   */
  _createUpload (fileIDs, opts = {}) {
    const {
      forceAllowNewUpload = false // uppy.retryAll sets this to true — when retrying we want to ignore `allowNewUpload: false`
    } = opts

    const { allowNewUpload, currentUploads } = this.getState()
    if (!allowNewUpload && !forceAllowNewUpload) {
      throw new Error('Cannot create a new upload: already uploading.')
    }

    const uploadID = cuid()

    this.emit('upload', {
      id: uploadID,
      fileIDs: fileIDs
    })

    this.setState({
      allowNewUpload: this.opts.allowMultipleUploads !== false,

      currentUploads: {
        ...currentUploads,
        [uploadID]: {
          fileIDs: fileIDs,
          step: 0,
          result: {}
        }
      }
    })

    return uploadID
  }

  _getUpload (uploadID) {
    const { currentUploads } = this.getState()

    return currentUploads[uploadID]
  }

  /**
   * Add data to an upload's result object.
   *
   * @param {string} uploadID The ID of the upload.
   * @param {object} data Data properties to add to the result object.
   */
  addResultData (uploadID, data) {
    if (!this._getUpload(uploadID)) {
      this.log(`Not setting result for an upload that has been removed: ${uploadID}`)
      return
    }
    const currentUploads = this.getState().currentUploads
    const currentUpload = Object.assign({}, currentUploads[uploadID], {
      result: Object.assign({}, currentUploads[uploadID].result, data)
    })
    this.setState({
      currentUploads: Object.assign({}, currentUploads, {
        [uploadID]: currentUpload
      })
    })
  }

  /**
   * Remove an upload, eg. if it has been canceled or completed.
   *
   * @param {string} uploadID The ID of the upload.
   */
  _removeUpload (uploadID) {
    const currentUploads = { ...this.getState().currentUploads }
    delete currentUploads[uploadID]

    this.setState({
      currentUploads: currentUploads
    })
  }

  /**
   * Run an upload. This picks up where it left off in case the upload is being restored.
   *
   * @private
   */
  _runUpload (uploadID) {
    const uploadData = this.getState().currentUploads[uploadID]
    const restoreStep = uploadData.step

    const steps = [
      ...this.preProcessors,
      ...this.uploaders,
      ...this.postProcessors
    ]
    let lastStep = Promise.resolve()
    steps.forEach((fn, step) => {
      // Skip this step if we are restoring and have already completed this step before.
      if (step < restoreStep) {
        return
      }

      lastStep = lastStep.then(() => {
        const { currentUploads } = this.getState()
        const currentUpload = currentUploads[uploadID]
        if (!currentUpload) {
          return
        }

        const updatedUpload = Object.assign({}, currentUpload, {
          step: step
        })
        this.setState({
          currentUploads: Object.assign({}, currentUploads, {
            [uploadID]: updatedUpload
          })
        })

        // TODO give this the `updatedUpload` object as its only parameter maybe?
        // Otherwise when more metadata may be added to the upload this would keep getting more parameters
        return fn(updatedUpload.fileIDs, uploadID)
      }).then((result) => {
        return null
      })
    })

    // Not returning the `catch`ed promise, because we still want to return a rejected
    // promise from this method if the upload failed.
    lastStep.catch((err) => {
      this.emit('error', err, uploadID)
      this._removeUpload(uploadID)
    })

    return lastStep.then(() => {
      // Set result data.
      const { currentUploads } = this.getState()
      const currentUpload = currentUploads[uploadID]
      if (!currentUpload) {
        return
      }

      const files = currentUpload.fileIDs
        .map((fileID) => this.getFile(fileID))
      const successful = files.filter((file) => !file.error)
      const failed = files.filter((file) => file.error)
      this.addResultData(uploadID, { successful, failed, uploadID })
    }).then(() => {
      // Emit completion events.
      // This is in a separate function so that the `currentUploads` variable
      // always refers to the latest state. In the handler right above it refers
      // to an outdated object without the `.result` property.
      const { currentUploads } = this.getState()
      if (!currentUploads[uploadID]) {
        return
      }
      const currentUpload = currentUploads[uploadID]
      const result = currentUpload.result
      this.emit('complete', result)

      this._removeUpload(uploadID)

      return result
    }).then((result) => {
      if (result == null) {
        this.log(`Not setting result for an upload that has been removed: ${uploadID}`)
      }
      return result
    })
  }

  /**
   * Start an upload for all the files that are not currently being uploaded.
   *
   * @returns {Promise}
   */
  upload () {
    if (!this.plugins.uploader) {
      this.log('No uploader type plugins are used', 'warning')
    }

    let files = this.getState().files

    const onBeforeUploadResult = this.opts.onBeforeUpload(files)

    if (onBeforeUploadResult === false) {
      return Promise.reject(new Error('Not starting the upload because onBeforeUpload returned false'))
    }

    if (onBeforeUploadResult && typeof onBeforeUploadResult === 'object') {
      files = onBeforeUploadResult
      // Updating files in state, because uploader plugins receive file IDs,
      // and then fetch the actual file object from state
      this.setState({
        files: files
      })
    }

    return Promise.resolve()
      .then(() => this._checkMinNumberOfFiles(files))
      .catch((err) => {
        this._showOrLogErrorAndThrow(err)
      })
      .then(() => {
        const { currentUploads } = this.getState()
        // get a list of files that are currently assigned to uploads
        const currentlyUploadingFiles = Object.keys(currentUploads).reduce((prev, curr) => prev.concat(currentUploads[curr].fileIDs), [])

        const waitingFileIDs = []
        Object.keys(files).forEach((fileID) => {
          const file = this.getFile(fileID)
          // if the file hasn't started uploading and hasn't already been assigned to an upload..
          if ((!file.progress.uploadStarted) && (currentlyUploadingFiles.indexOf(fileID) === -1)) {
            waitingFileIDs.push(file.id)
          }
        })

        const uploadID = this._createUpload(waitingFileIDs)
        return this._runUpload(uploadID)
      })
      .catch((err) => {
        this._showOrLogErrorAndThrow(err, {
          showInformer: false
        })
      })
  }
}

module.exports = function (opts) {
  return new Uppy(opts)
}

// Expose class constructor.
module.exports.Uppy = Uppy
module.exports.Plugin = Plugin
module.exports.debugLogger = debugLogger
