const Utils = require('../core/Utils')
const Translator = require('../core/Translator')
const ee = require('namespace-emitter')
const cuid = require('cuid')
const throttle = require('lodash.throttle')
const prettyBytes = require('prettier-bytes')
const match = require('mime-match')
const DefaultStore = require('../store/DefaultStore')
// const deepFreeze = require('deep-freeze-strict')

/**
 * Main Uppy core
 *
 * @param {object} opts general options, like locales, to show modal or not to show
 */
class Uppy {
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
        uppyServerError: 'Connection with Uppy Server failed'
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
      onBeforeFileAdded: (currentFile, files) => Promise.resolve(),
      onBeforeUpload: (files, done) => Promise.resolve(),
      locale: defaultLocale,
      store: new DefaultStore(),
      thumbnailGeneration: true
    }

    // Merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.locale = Object.assign({}, defaultLocale, this.opts.locale)
    this.locale.strings = Object.assign({}, defaultLocale.strings, this.opts.locale.strings)

    // i18n
    this.translator = new Translator({locale: this.locale})
    this.i18n = this.translator.translate.bind(this.translator)

    // Container for different types of plugins
    this.plugins = {}

    this.translator = new Translator({locale: this.opts.locale})
    this.i18n = this.translator.translate.bind(this.translator)
    this.getState = this.getState.bind(this)
    this.getPlugin = this.getPlugin.bind(this)
    this.setFileMeta = this.setFileMeta.bind(this)
    this.setFileState = this.setFileState.bind(this)
    // this._initSocket = this._initSocket.bind(this)
    this.log = this.log.bind(this)
    this.info = this.info.bind(this)
    this.hideInfo = this.hideInfo.bind(this)
    this.addFile = this.addFile.bind(this)
    this.removeFile = this.removeFile.bind(this)
    this.pauseResume = this.pauseResume.bind(this)
    this._calculateProgress = this._calculateProgress.bind(this)
    this.resetProgress = this.resetProgress.bind(this)

    this.pauseAll = this.pauseAll.bind(this)
    this.resumeAll = this.resumeAll.bind(this)
    this.retryAll = this.retryAll.bind(this)
    this.cancelAll = this.cancelAll.bind(this)
    this.retryUpload = this.retryUpload.bind(this)
    this.upload = this.upload.bind(this)

    // this.bus = this.emitter = ee()
    this.emitter = ee()
    this.on = this.emitter.on.bind(this.emitter)
    this.off = this.emitter.off.bind(this.emitter)
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
    if (this.opts.debug) {
      global.uppyLog = ''
      global[this.opts.id] = this
    }
  }

  /**
   * Iterate on all plugins and run `update` on them. Called each time state changes
   *
   */
  updateAll (state) {
    this.iteratePlugins(plugin => {
      plugin.update(state)
    })
  }

  /**
   * Updates state
   *
   * @param {patch} object
   */
  setState (patch) {
    this.store.setState(patch)
  }

  /**
   * Returns current state
   */
  getState () {
    return this.store.getState()
  }

  // Back compat.
  get state () {
    return this.getState()
  }

  /**
  * Shorthand to set state for a specific file
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
  * Check if minNumberOfFiles restriction is reached before uploading
  *
  * @return {boolean}
  * @private
  */
  _checkMinNumberOfFiles () {
    const {minNumberOfFiles} = this.opts.restrictions
    if (Object.keys(this.getState().files).length < minNumberOfFiles) {
      this.info(`${this.i18n('youHaveToAtLeastSelectX', {smart_count: minNumberOfFiles})}`, 'error', 5000)
      return false
    }
    return true
  }

  /**
  * Check if file passes a set of restrictions set in options: maxFileSize,
  * maxNumberOfFiles and allowedFileTypes
  *
  * @param {object} file object to check
  * @return {boolean}
  * @private
  */
  _checkRestrictions (file) {
    const {maxFileSize, maxNumberOfFiles, allowedFileTypes} = this.opts.restrictions

    if (maxNumberOfFiles) {
      if (Object.keys(this.getState().files).length + 1 > maxNumberOfFiles) {
        this.info(`${this.i18n('youCanOnlyUploadX', {smart_count: maxNumberOfFiles})}`, 'error', 5000)
        return false
      }
    }

    if (allowedFileTypes) {
      const isCorrectFileType = allowedFileTypes.filter(match(file.type)).length > 0
      if (!isCorrectFileType) {
        const allowedFileTypesString = allowedFileTypes.join(', ')
        this.info(`${this.i18n('youCanOnlyUploadFileTypes')} ${allowedFileTypesString}`, 'error', 5000)
        return false
      }
    }

    if (maxFileSize) {
      if (file.data.size > maxFileSize) {
        this.info(`${this.i18n('exceedsSize')} ${prettyBytes(maxFileSize)}`, 'error', 5000)
        return false
      }
    }

    return true
  }

  /**
  * Add a new file to `state.files`. This will run `onBeforeFileAdded`,
  * try to guess file type in a clever way, check file against restrictions,
  * and start an upload if `autoProceed === true`.
  *
  * @param {object} file object to add
  */
  addFile (file) {
    // Wrap this in a Promise `.then()` handler so errors will reject the Promise
    // instead of throwing.
    const beforeFileAdded = Promise.resolve()
      .then(() => this.opts.onBeforeFileAdded(file, this.getState().files))

    return beforeFileAdded.catch((err) => {
      const message = typeof err === 'object' ? err.message : err
      this.info(message, 'error', 5000)
      return Promise.reject(new Error(`onBeforeFileAdded: ${message}`))
    }).then(() => {
      return Utils.getFileType(file).then((fileType) => {
        const updatedFiles = Object.assign({}, this.getState().files)
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

        const newFile = {
          source: file.source || '',
          id: fileID,
          name: fileName,
          extension: fileExtension || '',
          meta: Object.assign({}, this.getState().meta, {
            name: fileName,
            type: fileType
          }),
          type: fileType,
          data: file.data,
          progress: {
            percentage: 0,
            bytesUploaded: 0,
            bytesTotal: file.data.size || 0,
            uploadComplete: false,
            uploadStarted: false
          },
          size: file.data.size || 'N/A',
          isRemote: isRemote,
          remote: file.remote || '',
          preview: file.preview
        }

        const isFileAllowed = this._checkRestrictions(newFile)
        if (!isFileAllowed) return Promise.reject(new Error('File not allowed'))

        updatedFiles[fileID] = newFile
        this.setState({files: updatedFiles})

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
      })
    })
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
      this.removeUpload(uploadID)
    })

    this._calculateTotalProgress()
    this.emit('file-removed', fileID)

    // Clean up object URLs.
    if (removedFile.preview && Utils.isObjectURL(removedFile.preview)) {
      URL.revokeObjectURL(removedFile.preview)
    }

    this.log(`Removed file: ${fileID}`)
  }

  /**
   * Generate a preview image for the given file, if possible.
   */
  generatePreview (file) {
    if (Utils.isPreviewSupported(file.type) && !file.isRemote) {
      let previewPromise
      if (this.opts.thumbnailGeneration === true) {
        previewPromise = Utils.createThumbnail(file, 280)
      } else {
        previewPromise = Promise.resolve(URL.createObjectURL(file.data))
      }
      previewPromise.then((preview) => {
        this.setPreviewURL(file.id, preview)
      }).catch((err) => {
        console.warn(err.stack || err.message)
      })
    }
  }

  /**
   * Set the preview URL for a file.
   */
  setPreviewURL (fileID, preview) {
    this.setFileState(fileID, { preview: preview })
  }

  pauseResume (fileID) {
    const updatedFiles = Object.assign({}, this.getState().files)

    if (updatedFiles[fileID].uploadComplete) return

    const wasPaused = updatedFiles[fileID].isPaused || false
    const isPaused = !wasPaused

    const updatedFile = Object.assign({}, updatedFiles[fileID], {
      isPaused: isPaused
    })

    updatedFiles[fileID] = updatedFile
    this.setState({files: updatedFiles})

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
    this.setState({ files: {}, totalProgress: 0 })
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

  _calculateProgress (data) {
    const fileID = data.id

    // skip progress event for a file that’s been removed
    if (!this.getState().files[fileID]) {
      this.log('Trying to set progress for a file that’s been removed: ', fileID)
      return
    }

    this.setFileState(fileID, {
      progress: Object.assign({}, this.getState().files[fileID].progress, {
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
   * `error`, `file-added`, `file-removed`, `upload-progress`
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

    this.on('upload-error', (fileID, error) => {
      this.setFileState(fileID, { error: error.message })
      this.setState({ error: error.message })

      const fileName = this.getState().files[fileID].name
      let message = `Failed to upload ${fileName}`
      if (typeof error === 'object' && error.message) {
        message = { message: message, details: error.message }
      }
      this.info(message, 'error', 5000)
    })

    this.on('upload', () => {
      this.setState({ error: null })
    })

    // this.on('file-add', (data) => {
    //   this.addFile(data)
    // })

    this.on('file-added', (file) => {
      this.generatePreview(file)
    })

    this.on('file-remove', (fileID) => {
      this.removeFile(fileID)
    })

    this.on('upload-started', (fileID, upload) => {
      this.setFileState(fileID, {
        progress: Object.assign({}, this.getState().files[fileID].progress, {
          uploadStarted: Date.now(),
          uploadComplete: false,
          percentage: 0,
          bytesUploaded: 0
        })
      })
    })

    // upload progress events can occur frequently, especially when you have a good
    // connection to the remote server. Therefore, we are throtteling them to
    // prevent accessive function calls.
    // see also: https://github.com/tus/tus-js-client/commit/9940f27b2361fd7e10ba58b09b60d82422183bbb
    const _throttledCalculateProgress = throttle(this._calculateProgress, 100, { leading: true, trailing: false })

    this.on('upload-progress', _throttledCalculateProgress)

    this.on('upload-success', (fileID, uploadResp, uploadURL) => {
      this.setFileState(fileID, {
        progress: Object.assign({}, this.getState().files[fileID].progress, {
          uploadComplete: true,
          percentage: 100
        }),
        uploadURL: uploadURL,
        isPaused: false
      })

      this._calculateTotalProgress()
    })

    this.on('preprocess-progress', (fileID, progress) => {
      this.setFileState(fileID, {
        progress: Object.assign({}, this.getState().files[fileID].progress, {
          preprocess: progress
        })
      })
    })

    this.on('preprocess-complete', (fileID) => {
      const files = Object.assign({}, this.getState().files)
      files[fileID] = Object.assign({}, files[fileID], {
        progress: Object.assign({}, files[fileID].progress)
      })
      delete files[fileID].progress.preprocess

      this.setState({ files: files })
    })

    this.on('postprocess-progress', (fileID, progress) => {
      this.setFileState(fileID, {
        progress: Object.assign({}, this.getState().files[fileID].progress, {
          postprocess: progress
        })
      })
    })

    this.on('postprocess-complete', (fileID) => {
      const files = Object.assign({}, this.getState().files)
      files[fileID] = Object.assign({}, files[fileID], {
        progress: Object.assign({}, files[fileID].progress)
      })
      delete files[fileID].progress.postprocess
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
      this.info('No internet connection', 'error', 0)
      this.wasOffline = true
    } else {
      this.emit('is-online')
      if (this.wasOffline) {
        this.emit('back-online')
        this.info('Connected!', 'success', 3000)
        this.wasOffline = false
      }
    }
  }

  getID () {
    return this.opts.id
  }

  /**
   * Registers a plugin with Core
   *
   * @param {Class} Plugin object
   * @param {Object} options object that will be passed to Plugin later
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
      let msg = `Already found a plugin named '${existsPluginAlready.id}'.
        Tried to use: '${pluginId}'.
        Uppy is currently limited to running one of every plugin.
        Share your use case with us over at
        https://github.com/transloadit/uppy/issues/
        if you want us to reconsider.`
      throw new Error(msg)
    }

    this.plugins[plugin.type].push(plugin)
    plugin.install()

    return this
  }

  /**
   * Find one Plugin by name
   *
   * @param string name description
   */
  getPlugin (name) {
    let foundPlugin = false
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
   * Iterate through all `use`d plugins
   *
   * @param function method description
   */
  iteratePlugins (method) {
    Object.keys(this.plugins).forEach(pluginType => {
      this.plugins[pluginType].forEach(method)
    })
  }

  /**
   * Uninstall and remove a plugin.
   *
   * @param {Plugin} instance The plugin instance to remove.
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
  * can display the message
  *
  * @param {string} msg Message to be displayed by the informer
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

    window.clearTimeout(this.infoTimeoutID)
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
   * @param {String} type optional `error` or `warning`
   */
  log (msg, type) {
    if (!this.opts.debug) {
      return
    }

    let message = `[Uppy] [${Utils.getTimeStamp()}] ${msg}`

    global.uppyLog = global.uppyLog + '\n' + 'DEBUG LOG: ' + msg

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

  // _initSocket (opts) {
  //   if (!this.socket) {
  //     this.socket = new UppySocket(opts)
  //   }

  //   return this.socket
  // }

  /**
   * Initializes actions, installs all plugins (by iterating on them and calling `install`), sets options
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
          step: 0
        }
      })
    })

    return uploadID
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
      })
    })

    // Not returning the `catch`ed promise, because we still want to return a rejected
    // promise from this method if the upload failed.
    lastStep.catch((err) => {
      this.emit('error', err)

      this._removeUpload(uploadID)
    })

    return lastStep.then(() => {
      const files = fileIDs.map((fileID) => this.getFile(fileID))
      const successful = files.filter((file) => file && !file.error)
      const failed = files.filter((file) => file && file.error)
      this.emit('complete', { successful, failed })

      // Compatibility with pre-0.21
      this.emit('success', fileIDs)

      this._removeUpload(uploadID)

      return { successful, failed }
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

    const isMinNumberOfFilesReached = this._checkMinNumberOfFiles()
    if (!isMinNumberOfFilesReached) {
      return Promise.reject(new Error('Minimum number of files has not been reached'))
    }

    const beforeUpload = Promise.resolve()
      .then(() => this.opts.onBeforeUpload(this.getState().files))

    return beforeUpload.catch((err) => {
      const message = typeof err === 'object' ? err.message : err
      this.info(message, 'error', 5000)
      return Promise.reject(new Error(`onBeforeUpload: ${message}`))
    }).then(() => {
      const waitingFileIDs = []
      Object.keys(this.getState().files).forEach((fileID) => {
        const file = this.getFile(fileID)

        if (!file.progress.uploadStarted || file.isRemote) {
          waitingFileIDs.push(file.id)
        }
      })

      const uploadID = this._createUpload(waitingFileIDs)
      return this._runUpload(uploadID)
    })
  }
}

module.exports = function (opts) {
  return new Uppy(opts)
}
// Expose class constructor.
module.exports.Uppy = Uppy
