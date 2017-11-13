const Utils = require('../core/Utils')
const Translator = require('../core/Translator')
const UppySocket = require('./UppySocket')
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
      store: new DefaultStore()
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
    this.updateMeta = this.updateMeta.bind(this)
    this.initSocket = this.initSocket.bind(this)
    this.log = this.log.bind(this)
    this.info = this.info.bind(this)
    this.hideInfo = this.hideInfo.bind(this)
    this.addFile = this.addFile.bind(this)
    this.removeFile = this.removeFile.bind(this)
    this.pauseResume = this.pauseResume.bind(this)
    this.calculateProgress = this.calculateProgress.bind(this)
    this.resetProgress = this.resetProgress.bind(this)

    this.pauseAll = this.pauseAll.bind(this)
    this.resumeAll = this.resumeAll.bind(this)
    this.retryAll = this.retryAll.bind(this)
    this.cancelAll = this.cancelAll.bind(this)
    this.retryUpload = this.retryUpload.bind(this)

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
      this.emit('core:state-update', prevState, nextState, patch)
      this.updateAll(nextState)
    })

    // for debugging and testing
    // this.updateNum = 0
    if (this.opts.debug) {
      global.uppyLog = ''
      global[this.opts.id] = this
      // global._uppy = this
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
    this.emit('core:reset-progress')
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
    const newMeta = Object.assign({}, this.getState().meta, data)
    this.log('Adding metadata:')
    this.log(data)
    this.setState({meta: newMeta})
  }

  updateMeta (data, fileID) {
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
  * Check if minNumberOfFiles restriction is reached before uploading
  *
  * @return {boolean}
  * @private
  */
  checkMinNumberOfFiles () {
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
  checkRestrictions (file) {
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

        const isFileAllowed = this.checkRestrictions(newFile)
        if (!isFileAllowed) return Promise.reject(new Error('File not allowed'))

        updatedFiles[fileID] = newFile
        this.setState({files: updatedFiles})

        this.emit('core:file-added', newFile)
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
    const updatedFiles = Object.assign({}, this.getState().files)
    const removedFile = updatedFiles[fileID]
    delete updatedFiles[fileID]

    this.setState({files: updatedFiles})
    this.calculateTotalProgress()
    this.emit('core:file-removed', fileID)

    // Clean up object URLs.
    if (removedFile.preview && Utils.isObjectURL(removedFile.preview)) {
      URL.revokeObjectURL(removedFile.preview)
    }

    this.log(`Removed file: ${fileID}`)
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
   * Generate a preview image for the given file, if possible.
   */
  generatePreview (file) {
    if (Utils.isPreviewSupported(file.type) && !file.isRemote) {
      Utils.createThumbnail(file, 200).then((thumbnail) => {
        this.setPreviewURL(file.id, thumbnail)
      }).catch((err) => {
        console.warn(err.stack || err.message)
      })
    }
  }

  /**
   * Set the preview URL for a file.
   */
  setPreviewURL (fileID, preview) {
    const { files } = this.getState()
    this.setState({
      files: Object.assign({}, files, {
        [fileID]: Object.assign({}, files[fileID], {
          preview: preview
        })
      })
    })
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

    this.emit('core:upload-pause', fileID, isPaused)

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

    this.emit('core:pause-all')
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

    this.emit('core:resume-all')
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

    this.emit('core:retry-all', filesToRetry)

    const uploadID = this.createUpload(filesToRetry)
    return this.runUpload(uploadID)
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

    this.emit('core:upload-retry', fileID)

    const uploadID = this.createUpload([ fileID ])
    return this.runUpload(uploadID)
  }

  reset () {
    this.cancelAll()
  }

  cancelAll () {
    this.emit('core:cancel-all')
    this.setState({ files: {}, totalProgress: 0 })
  }

  calculateProgress (data) {
    const fileID = data.id
    const updatedFiles = Object.assign({}, this.getState().files)

    // skip progress event for a file that’s been removed
    if (!updatedFiles[fileID]) {
      this.log('Trying to set progress for a file that’s not with us anymore: ', fileID)
      return
    }

    const updatedFile = Object.assign({}, updatedFiles[fileID],
      Object.assign({}, {
        progress: Object.assign({}, updatedFiles[fileID].progress, {
          bytesUploaded: data.bytesUploaded,
          bytesTotal: data.bytesTotal,
          percentage: Math.floor((data.bytesUploaded / data.bytesTotal * 100).toFixed(2))
        })
      }
    ))
    updatedFiles[data.id] = updatedFile

    this.setState({
      files: updatedFiles
    })

    this.calculateTotalProgress()
  }

  calculateTotalProgress () {
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
   * `file-add`, `file-remove`, `upload-progress`, `reset`
   *
   */
  actions () {
    // this.bus.on('*', (payload) => {
    //   console.log('emitted: ', this.event)
    //   console.log('with payload: ', payload)
    // })

    // stress-test re-rendering
    // setInterval(() => {
    //   this.setState({bla: 'bla'})
    // }, 20)

    // this.on('core:state-update', (prevState, nextState, patch) => {
    //   if (this.withDevTools) {
    //     this.devTools.send('UPPY_STATE_UPDATE', nextState)
    //   }
    // })

    this.on('core:error', (error) => {
      this.setState({ error: error.message })
    })

    this.on('core:upload-error', (fileID, error) => {
      const updatedFiles = Object.assign({}, this.getState().files)
      const updatedFile = Object.assign({}, updatedFiles[fileID],
        { error: error.message }
      )
      updatedFiles[fileID] = updatedFile
      this.setState({ files: updatedFiles, error: error.message })

      const fileName = this.getState().files[fileID].name
      let message = `Failed to upload ${fileName}`
      if (typeof error === 'object' && error.message) {
        message = { message: message, details: error.message }
      }
      this.info(message, 'error', 5000)
    })

    this.on('core:upload', () => {
      this.setState({ error: null })
    })

    this.on('core:file-add', (data) => {
      this.addFile(data)
    })

    this.on('core:file-added', (file) => {
      this.generatePreview(file)
    })

    this.on('core:file-remove', (fileID) => {
      this.removeFile(fileID)
    })

    this.on('core:upload-started', (fileID, upload) => {
      const updatedFiles = Object.assign({}, this.getState().files)
      const updatedFile = Object.assign({}, updatedFiles[fileID],
        Object.assign({}, {
          progress: Object.assign({}, updatedFiles[fileID].progress, {
            uploadStarted: Date.now(),
            uploadComplete: false,
            percentage: 0,
            bytesUploaded: 0
          })
        }
      ))
      updatedFiles[fileID] = updatedFile

      this.setState({files: updatedFiles})
    })

    // upload progress events can occur frequently, especially when you have a good
    // connection to the remote server. Therefore, we are throtteling them to
    // prevent accessive function calls.
    // see also: https://github.com/tus/tus-js-client/commit/9940f27b2361fd7e10ba58b09b60d82422183bbb
    const throttledCalculateProgress = throttle(this.calculateProgress, 100, {leading: true, trailing: false})

    this.on('core:upload-progress', (data) => {
      throttledCalculateProgress(data)
    })

    this.on('core:upload-success', (fileID, uploadResp, uploadURL) => {
      const updatedFiles = Object.assign({}, this.getState().files)
      const updatedFile = Object.assign({}, updatedFiles[fileID], {
        progress: Object.assign({}, updatedFiles[fileID].progress, {
          uploadComplete: true,
          percentage: 100
        }),
        uploadURL: uploadURL,
        isPaused: false
      })
      updatedFiles[fileID] = updatedFile

      this.setState({
        files: updatedFiles
      })

      this.calculateTotalProgress()
    })

    this.on('core:update-meta', (data, fileID) => {
      this.updateMeta(data, fileID)
    })

    this.on('core:preprocess-progress', (fileID, progress) => {
      const files = Object.assign({}, this.getState().files)
      files[fileID] = Object.assign({}, files[fileID], {
        progress: Object.assign({}, files[fileID].progress, {
          preprocess: progress
        })
      })

      this.setState({ files: files })
    })
    this.on('core:preprocess-complete', (fileID) => {
      const files = Object.assign({}, this.getState().files)
      files[fileID] = Object.assign({}, files[fileID], {
        progress: Object.assign({}, files[fileID].progress)
      })
      delete files[fileID].progress.preprocess

      this.setState({ files: files })
    })
    this.on('core:postprocess-progress', (fileID, progress) => {
      const files = Object.assign({}, this.getState().files)
      files[fileID] = Object.assign({}, files[fileID], {
        progress: Object.assign({}, files[fileID].progress, {
          postprocess: progress
        })
      })

      this.setState({ files: files })
    })
    this.on('core:postprocess-complete', (fileID) => {
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
    Object.keys(this.plugins).forEach((pluginType) => {
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

    if (this.withDevTools) {
      this.devToolsUnsubscribe()
    }

    this._storeUnsubscribe()

    this.iteratePlugins((plugin) => {
      plugin.uninstall()
    })

    if (this.socket) {
      this.socket.close()
    }
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

    this.emit('core:info-visible')

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
    this.emit('core:info-hidden')
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

  initSocket (opts) {
    if (!this.socket) {
      this.socket = new UppySocket(opts)
    }

    return this.socket
  }

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
      this.removeUpload(uploadID)
      return Promise.reject(new Error('Nonexistent upload'))
    }

    return this.runUpload(uploadID)
  }

  /**
   * Create an upload for a bunch of files.
   *
   * @param {Array<string>} fileIDs File IDs to include in this upload.
   * @return {string} ID of this upload.
   */
  createUpload (fileIDs) {
    const uploadID = cuid()

    this.emit('core:upload', {
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
  removeUpload (uploadID) {
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
  runUpload (uploadID) {
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
      this.emit('core:error', err)

      this.removeUpload(uploadID)
    })

    return lastStep.then(() => {
      const files = fileIDs.map((fileID) => this.getFile(fileID))
      const successful = files.filter((file) => !file.error)
      const failed = files.filter((file) => file.error)
      this.emit('core:complete', { successful, failed })

      // Compatibility with pre-0.21
      this.emit('core:success', fileIDs)

      this.removeUpload(uploadID)

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

    const isMinNumberOfFilesReached = this.checkMinNumberOfFiles()
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

      const uploadID = this.createUpload(waitingFileIDs)
      return this.runUpload(uploadID)
    })
  }
}

module.exports = function (opts) {
  return new Uppy(opts)
}
// Expose class constructor.
module.exports.Uppy = Uppy
