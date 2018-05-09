const Utils = require('../core/Utils')
const Translator = require('../core/Translator')
const ee = require('namespace-emitter')
const cuid = require('cuid')
const throttle = require('lodash.throttle')
const prettyBytes = require('prettier-bytes')
const match = require('mime-match')
const DefaultStore = require('../store/DefaultStore')

/**
 * Uppy Core module.
 * Manages plugins, state updates, acts as an event bus,
 * adds/removes files and metadata.
 */
class Uppy {
  /**
  * Instantiate Uppy
  * @param {object} opts — Uppy options
  */
  constructor (opts) {
    const defaultLocale = {
      strings: {
        youCanOnlyUploadX: {
          0: 'You can only upload %{smart_count} file',
          1: 'You can only upload %{smart_count} files'
        },
        youHaveToAtLeastSelectX: {
          0: 'You have to select at least %{smart_count} file',
          1: 'You have to select at least %{smart_count} files'
        },
        exceedsSize: 'This file exceeds maximum allowed size of',
        youCanOnlyUploadFileTypes: 'You can only upload:',
        uppyServerError: 'Connection with Uppy Server failed',
        failedToUpload: 'Failed to upload',
        noInternetConnection: 'No Internet connection',
        connectedToInternet: 'Connected to the Internet'
      }
    }

    // set default options
    const defaultOptions = {
      id: 'uppy',
      autoProceed: true,
      debug: false,
      restrictions: {
        maxFileSize: false,
        maxNumberOfFiles: false,
        minNumberOfFiles: false,
        allowedFileTypes: false
      },
      meta: {},
      onBeforeFileAdded: (currentFile, files) => currentFile,
      onBeforeUpload: (files) => files,
      locale: defaultLocale,
      store: DefaultStore()
    }

    // Merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)
    this.opts.restrictions = Object.assign({}, defaultOptions.restrictions, this.opts.restrictions)

    this.locale = Object.assign({}, defaultLocale, this.opts.locale)
    this.locale.strings = Object.assign({}, defaultLocale.strings, this.opts.locale.strings)

    // i18n
    this.translator = new Translator({locale: this.locale})
    this.i18n = this.translator.translate.bind(this.translator)

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
    this._calculateProgress = this._calculateProgress.bind(this)
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
      capabilities: {
        resumableUploads: false
      },
      totalProgress: 0,
      meta: Object.assign({}, this.opts.meta),
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

    // for debugging and testing
    // this.updateNum = 0
    if (this.opts.debug && typeof window !== 'undefined') {
      window['uppyLog'] = ''
      window[this.opts.id] = this
    }
  }

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
   * @return {object}
   */
  getState () {
    return this.store.getState()
  }

  /**
  * Back compat for when this.state is used instead of this.getState().
  */
  get state () {
    return this.getState()
  }

  /**
  * Shorthand to set state for a specific file.
  */
  setFileState (fileID, state) {
    this.setState({
      files: Object.assign({}, this.getState().files, {
        [fileID]: Object.assign({}, this.getState().files[fileID], state)
      })
    })
  }

  resetProgress () {
    const defaultProgress = {
      percentage: 0,
      bytesUploaded: 0,
      uploadComplete: false,
      uploadStarted: false
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

    // TODO Document on the website
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
      this.log('Was trying to set metadata for a file that’s not with us anymore: ', fileID)
      return
    }
    const newMeta = Object.assign({}, updatedFiles[fileID].meta, data)
    updatedFiles[fileID] = Object.assign({}, updatedFiles[fileID], {
      meta: newMeta
    })
    this.setState({files: updatedFiles})
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
  * Check if minNumberOfFiles restriction is reached before uploading.
  *
  * @private
  */
  _checkMinNumberOfFiles (files) {
    const {minNumberOfFiles} = this.opts.restrictions
    if (Object.keys(files).length < minNumberOfFiles) {
      throw new Error(`${this.i18n('youHaveToAtLeastSelectX', { smart_count: minNumberOfFiles })}`)
    }
  }

  /**
  * Check if file passes a set of restrictions set in options: maxFileSize,
  * maxNumberOfFiles and allowedFileTypes.
  *
  * @param {object} file object to check
  * @private
  */
  _checkRestrictions (file) {
    const {maxFileSize, maxNumberOfFiles, allowedFileTypes} = this.opts.restrictions

    if (maxNumberOfFiles) {
      if (Object.keys(this.getState().files).length + 1 > maxNumberOfFiles) {
        throw new Error(`${this.i18n('youCanOnlyUploadX', { smart_count: maxNumberOfFiles })}`)
      }
    }

    if (allowedFileTypes) {
      const isCorrectFileType = allowedFileTypes.filter((type) => {
        if (!file.type) return false
        return match(file.type, type)
      }).length > 0

      if (!isCorrectFileType) {
        const allowedFileTypesString = allowedFileTypes.join(', ')
        throw new Error(`${this.i18n('youCanOnlyUploadFileTypes')} ${allowedFileTypesString}`)
      }
    }

    if (maxFileSize) {
      if (file.data.size > maxFileSize) {
        throw new Error(`${this.i18n('exceedsSize')} ${prettyBytes(maxFileSize)}`)
      }
    }
  }

  /**
  * Add a new file to `state.files`. This will run `onBeforeFileAdded`,
  * try to guess file type in a clever way, check file against restrictions,
  * and start an upload if `autoProceed === true`.
  *
  * @param {object} file object to add
  */
  addFile (file) {
    const { files } = this.getState()

    const onError = (msg) => {
      const err = typeof msg === 'object' ? msg : new Error(msg)
      this.log(err.message)
      this.info(err.message, 'error', 5000)
      throw err
    }

    const onBeforeFileAddedResult = this.opts.onBeforeFileAdded(file, files)

    if (onBeforeFileAddedResult === false) {
      this.log('Not adding file because onBeforeFileAdded returned false')
      return
    }

    if (typeof onBeforeFileAddedResult === 'object' && onBeforeFileAddedResult) {
      // warning after the change in 0.24
      if (onBeforeFileAddedResult.then) {
        throw new TypeError('onBeforeFileAdded() returned a Promise, but this is no longer supported. It must be synchronous.')
      }
      file = onBeforeFileAddedResult
    }

    const fileType = Utils.getFileType(file)
    let fileName
    if (file.name) {
      fileName = file.name
    } else if (fileType.split('/')[0] === 'image') {
      fileName = fileType.split('/')[0] + '.' + fileType.split('/')[1]
    } else {
      fileName = 'noname'
    }
    const fileExtension = Utils.getFileNameAndExtension(fileName).extension
    const isRemote = file.isRemote || false

    const fileID = Utils.generateFileID(file)

    const meta = file.meta || {}
    meta.name = fileName
    meta.type = fileType

    const newFile = {
      source: file.source || '',
      id: fileID,
      name: fileName,
      extension: fileExtension || '',
      meta: Object.assign({}, this.getState().meta, meta),
      type: fileType,
      data: file.data,
      progress: {
        percentage: 0,
        bytesUploaded: 0,
        bytesTotal: file.data.size || 0,
        uploadComplete: false,
        uploadStarted: false
      },
      size: file.data.size || 0,
      isRemote: isRemote,
      remote: file.remote || '',
      preview: file.preview
    }

    try {
      this._checkRestrictions(newFile)
    } catch (err) {
      onError(err)
    }

    this.setState({
      files: Object.assign({}, files, {
        [fileID]: newFile
      })
    })

    this.emit('file-added', newFile)
    this.log(`Added file: ${fileName}, ${fileID}, mime type: ${fileType}`)

    if (this.opts.autoProceed && !this.scheduledAutoProceed) {
      this.scheduledAutoProceed = setTimeout(() => {
        this.scheduledAutoProceed = null
        this.upload().catch((err) => {
          console.error(err.stack || err.message || err)
        })
      }, 4)
    }
  }

  removeFile (fileID) {
    const { files, currentUploads } = this.state
    const updatedFiles = Object.assign({}, files)
    const removedFile = updatedFiles[fileID]
    delete updatedFiles[fileID]

    // Remove this file from its `currentUpload`.
    const updatedUploads = Object.assign({}, currentUploads)
    const removeUploads = []
    Object.keys(updatedUploads).forEach((uploadID) => {
      const newFileIDs = currentUploads[uploadID].fileIDs.filter((uploadFileID) => uploadFileID !== fileID)
      // Remove the upload if no files are associated with it anymore.
      if (newFileIDs.length === 0) {
        removeUploads.push(uploadID)
        return
      }

      updatedUploads[uploadID] = Object.assign({}, currentUploads[uploadID], {
        fileIDs: newFileIDs
      })
    })

    this.setState({
      currentUploads: updatedUploads,
      files: updatedFiles
    })

    removeUploads.forEach((uploadID) => {
      this._removeUpload(uploadID)
    })

    this._calculateTotalProgress()
    this.emit('file-removed', removedFile)
    this.log(`File removed: ${removedFile.id}`)

    // Clean up object URLs.
    if (removedFile.preview && Utils.isObjectURL(removedFile.preview)) {
      URL.revokeObjectURL(removedFile.preview)
    }

    this.log(`Removed file: ${fileID}`)
  }

  pauseResume (fileID) {
    if (this.getFile(fileID).uploadComplete) return

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
    this.setState({files: updatedFiles})

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
    this.setState({files: updatedFiles})

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

    const uploadID = this._createUpload(filesToRetry)
    return this._runUpload(uploadID)
  }

  cancelAll () {
    this.emit('cancel-all')

    // TODO Or should we just call removeFile on all files?
    const { currentUploads } = this.getState()
    const uploadIDs = Object.keys(currentUploads)

    uploadIDs.forEach((id) => {
      this._removeUpload(id)
    })

    this.setState({
      files: {},
      totalProgress: 0
    })
  }

  retryUpload (fileID) {
    const updatedFiles = Object.assign({}, this.getState().files)
    const updatedFile = Object.assign({}, updatedFiles[fileID],
      { error: null, isPaused: false }
    )
    updatedFiles[fileID] = updatedFile
    this.setState({
      files: updatedFiles
    })

    this.emit('upload-retry', fileID)

    const uploadID = this._createUpload([ fileID ])
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

    this.setFileState(file.id, {
      progress: Object.assign({}, this.getFile(file.id).progress, {
        bytesUploaded: data.bytesUploaded,
        bytesTotal: data.bytesTotal,
        percentage: Math.floor((data.bytesUploaded / data.bytesTotal * 100).toFixed(2))
      })
    })

    this._calculateTotalProgress()
  }

  _calculateTotalProgress () {
    // calculate total progress, using the number of files currently uploading,
    // multiplied by 100 and the summ of individual progress of each file
    const files = Object.assign({}, this.getState().files)

    const inProgress = Object.keys(files).filter((file) => {
      return files[file].progress.uploadStarted
    })
    const progressMax = inProgress.length * 100
    let progressAll = 0
    inProgress.forEach((file) => {
      progressAll = progressAll + files[file].progress.percentage
    })

    const totalProgress = progressMax === 0 ? 0 : Math.floor((progressAll * 100 / progressMax).toFixed(2))

    this.setState({
      totalProgress: totalProgress
    })
  }

  /**
   * Registers listeners for all global actions, like:
   * `error`, `file-removed`, `upload-progress`
   *
   */
  actions () {
    // const log = this.log
    // this.on('*', function (payload) {
    //   log(`[Core] Event: ${this.event}`)
    //   log(payload)
    // })

    // stress-test re-rendering
    // setInterval(() => {
    //   this.setState({bla: 'bla'})
    // }, 20)

    this.on('error', (error) => {
      this.setState({ error: error.message })
    })

    this.on('upload-error', (file, error) => {
      this.setFileState(file.id, { error: error.message })
      this.setState({ error: error.message })

      let message
      message = `${this.i18n('failedToUpload')} ${file.name}`
      if (typeof error === 'object' && error.message) {
        message = { message: message, details: error.message }
      }
      this.info(message, 'error', 5000)
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

    // upload progress events can occur frequently, especially when you have a good
    // connection to the remote server. Therefore, we are throtteling them to
    // prevent accessive function calls.
    // see also: https://github.com/tus/tus-js-client/commit/9940f27b2361fd7e10ba58b09b60d82422183bbb
    const _throttledCalculateProgress = throttle(this._calculateProgress, 100, { leading: true, trailing: true })

    this.on('upload-progress', _throttledCalculateProgress)

    this.on('upload-success', (file, uploadResp, uploadURL) => {
      this.setFileState(file.id, {
        progress: Object.assign({}, this.getFile(file.id).progress, {
          uploadComplete: true,
          percentage: 100
        }),
        uploadURL: uploadURL,
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
    if (typeof window !== 'undefined') {
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
   * @return {Object} self for chaining
   */
  use (Plugin, opts) {
    if (typeof Plugin !== 'function') {
      let msg = `Expected a plugin class, but got ${Plugin === null ? 'null' : typeof Plugin}.` +
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

    let existsPluginAlready = this.getPlugin(pluginId)
    if (existsPluginAlready) {
      let msg = `Already found a plugin named '${existsPluginAlready.id}'. ` +
        `Tried to use: '${pluginId}'.\n` +
        `Uppy plugins must have unique 'id' options. See https://uppy.io/docs/plugins/#id.`
      throw new Error(msg)
    }

    this.plugins[plugin.type].push(plugin)
    plugin.install()

    return this
  }

  /**
   * Find one Plugin by name.
   *
   * @param {string} name description
   * @return {object | boolean}
   */
  getPlugin (name) {
    let foundPlugin = null
    this.iteratePlugins((plugin) => {
      const pluginName = plugin.id
      if (pluginName === name) {
        foundPlugin = plugin
        return false
      }
    })
    return foundPlugin
  }

  /**
   * Iterate through all `use`d plugins.
   *
   * @param {function} method that will be run on each plugin
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
    const list = this.plugins[instance.type]

    if (instance.uninstall) {
      instance.uninstall()
    }

    const index = list.indexOf(instance)
    if (index !== -1) {
      list.splice(index, 1)
    }
  }

  /**
   * Uninstall all plugins and close down this Uppy instance.
   */
  close () {
    this.reset()

    this._storeUnsubscribe()

    this.iteratePlugins((plugin) => {
      plugin.uninstall()
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
   * Logs stuff to console, only if `debug` is set to true. Silent in production.
   *
   * @param {String|Object} msg to log
   * @param {String} [type] optional `error` or `warning`
   */
  log (msg, type) {
    if (!this.opts.debug) {
      return
    }

    let message = `[Uppy] [${Utils.getTimeStamp()}] ${msg}`

    window['uppyLog'] = window['uppyLog'] + '\n' + 'DEBUG LOG: ' + msg

    if (type === 'error') {
      console.error(message)
      return
    }

    if (type === 'warning') {
      console.warn(message)
      return
    }

    if (msg === `${msg}`) {
      console.log(message)
    } else {
      message = `[Uppy] [${Utils.getTimeStamp()}]`
      console.log(message)
      console.dir(msg)
    }
  }

  /**
   * Initializes actions.
   *
   */
  run () {
    this.log('Core is run, initializing actions...')
    this.actions()

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
   * @return {string} ID of this upload.
   */
  _createUpload (fileIDs) {
    const uploadID = cuid()

    this.emit('upload', {
      id: uploadID,
      fileIDs: fileIDs
    })

    this.setState({
      currentUploads: Object.assign({}, this.getState().currentUploads, {
        [uploadID]: {
          fileIDs: fileIDs,
          step: 0,
          result: {}
        }
      })
    })

    return uploadID
  }

  _getUpload (uploadID) {
    return this.getState().currentUploads[uploadID]
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
    const currentUploads = Object.assign({}, this.getState().currentUploads)
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
    const fileIDs = uploadData.fileIDs
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
        const currentUpload = Object.assign({}, currentUploads[uploadID], {
          step: step
        })
        this.setState({
          currentUploads: Object.assign({}, currentUploads, {
            [uploadID]: currentUpload
          })
        })
        // TODO give this the `currentUpload` object as its only parameter maybe?
        // Otherwise when more metadata may be added to the upload this would keep getting more parameters
        return fn(fileIDs, uploadID)
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
      const files = fileIDs.map((fileID) => this.getFile(fileID))
      const successful = files.filter((file) => file && !file.error)
      const failed = files.filter((file) => file && file.error)
      this.addResultData(uploadID, { successful, failed, uploadID })

      const { currentUploads } = this.getState()
      if (!currentUploads[uploadID]) {
        this.log(`Not setting result for an upload that has been removed: ${uploadID}`)
        return
      }

      const result = currentUploads[uploadID].result
      this.emit('complete', result)

      this._removeUpload(uploadID)

      return result
    })
  }

  /**
   * Start an upload for all the files that are not currently being uploaded.
   *
   * @return {Promise}
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
      // warning after the change in 0.24
      if (onBeforeUploadResult.then) {
        throw new TypeError('onBeforeUpload() returned a Promise, but this is no longer supported. It must be synchronous.')
      }

      files = onBeforeUploadResult
    }

    return Promise.resolve()
      .then(() => this._checkMinNumberOfFiles(files))
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
        const message = typeof err === 'object' ? err.message : err
        this.log(message)
        this.info(message, 'error', 4000)
        return Promise.reject(typeof err === 'object' ? err : new Error(err))
      })
  }
}

module.exports = function (opts) {
  return new Uppy(opts)
}

// Expose class constructor.
module.exports.Uppy = Uppy
