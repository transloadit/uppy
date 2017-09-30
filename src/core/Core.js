const Utils = require('../core/Utils')
const Translator = require('../core/Translator')
const UppySocket = require('./UppySocket')
const ee = require('namespace-emitter')
const cuid = require('cuid')
const throttle = require('lodash.throttle')
const prettyBytes = require('prettier-bytes')
const match = require('mime-match')
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
      locale: defaultLocale
    }

    // Merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    // // Dictates in what order different plugin types are ran:
    // this.types = [ 'presetter', 'orchestrator', 'progressindicator',
    //                 'acquirer', 'modifier', 'uploader', 'presenter', 'debugger']

    this.locale = Object.assign({}, defaultLocale, this.opts.locale)
    this.locale.strings = Object.assign({}, defaultLocale.strings, this.opts.locale.strings)

    // i18n
    this.translator = new Translator({locale: this.locale})
    this.i18n = this.translator.translate.bind(this.translator)

    // Container for different types of plugins
    this.plugins = {}

    // @TODO maybe bindall
    this.translator = new Translator({locale: this.opts.locale})
    this.i18n = this.translator.translate.bind(this.translator)
    this.getState = this.getState.bind(this)
    this.updateMeta = this.updateMeta.bind(this)
    this.initSocket = this.initSocket.bind(this)
    this.log = this.log.bind(this)
    this.info = this.info.bind(this)
    this.hideInfo = this.hideInfo.bind(this)
    this.addFile = this.addFile.bind(this)
    this.removeFile = this.removeFile.bind(this)
    this.calculateProgress = this.calculateProgress.bind(this)
    this.resetProgress = this.resetProgress.bind(this)

    // this.bus = this.emitter = ee()
    this.emitter = ee()
    this.on = this.emitter.on.bind(this.emitter)
    this.off = this.emitter.off.bind(this.emitter)
    this.once = this.emitter.once.bind(this.emitter)
    this.emit = this.emitter.emit.bind(this.emitter)

    this.preProcessors = []
    this.uploaders = []
    this.postProcessors = []

    this.state = {
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
    }

    // for debugging and testing

    this.withDevTools = typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION__

    if (this.withDevTools) {
      this.devTools = window.devToolsExtension.connect()
      this.devToolsUnsubscribe = this.devTools.subscribe((message) => {
        // Implement monitors actions. For example time traveling:
        if (message.type === 'DISPATCH' && message.payload.type === 'JUMP_TO_STATE') {
          const state = JSON.parse(message.state)
          // this.setState(state)
          this.state = Object.assign({}, this.state, state)
          this.updateAll(this.state)
        }
      })
    }

    // this.updateNum = 0
    if (this.opts.debug) {
      global.UppyState = this.state
      global.uppyLog = ''
      // global.UppyAddFile = this.addFile.bind(this)
      global._uppy = this
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
    const prevState = Object.assign({}, this.state)
    const nextState = Object.assign({}, this.state, patch)

    this.state = nextState
    this.emit('core:state-update', prevState, nextState, patch)

    this.updateAll(this.state)
  }

  /**
   * Returns current state
   *
   */
  getState () {
    // use deepFreeze for debugging
    // return deepFreeze(this.state)
    return this.state
  }

  reset () {
    this.emit('core:pause-all')
    this.emit('core:cancel-all')
    this.setState({
      totalProgress: 0
    })
  }

  resetProgress () {
    const defaultProgress = {
      percentage: 0,
      bytesUploaded: 0,
      uploadComplete: false,
      uploadStarted: false
    }
    const files = Object.assign({}, this.state.files)
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
    if (Object.keys(this.state.files).length < minNumberOfFiles) {
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
      if (Object.keys(this.state.files).length + 1 > maxNumberOfFiles) {
        this.info(`${this.i18n('youCanOnlyUploadX', {smart_count: maxNumberOfFiles})}`, 'error', 5000)
        return false
      }
    }

    if (allowedFileTypes) {
      const isCorrectFileType = allowedFileTypes.filter(match(file.type.mime)).length > 0
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
        const updatedFiles = Object.assign({}, this.state.files)
        const fileName = file.name || 'noname'
        const fileExtension = Utils.getFileNameAndExtension(fileName)[1]
        const isRemote = file.isRemote || false

        const fileID = Utils.generateFileID(file)
        const fileTypeGeneral = fileType[0]
        const fileTypeSpecific = fileType[1]

        const newFile = {
          source: file.source || '',
          id: fileID,
          name: fileName,
          extension: fileExtension || '',
          meta: Object.assign({}, { name: fileName }, this.getState().meta),
          type: {
            general: fileTypeGeneral,
            specific: fileTypeSpecific,
            mime: fileType.join('/')
          },
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
    if (Utils.isPreviewSupported(file.type.specific) && !file.isRemote) {
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
    const { files } = this.state
    this.setState({
      files: Object.assign({}, files, {
        [fileID]: Object.assign({}, files[fileID], {
          preview: preview
        })
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

    this.on('core:state-update', (prevState, nextState, patch) => {
      if (this.withDevTools) {
        this.devTools.send('UPPY_STATE_UPDATE', nextState)
      }
    })

    this.on('core:error', (error) => {
      this.setState({ error })
    })

    this.on('core:upload-error', (fileID, error) => {
      const fileName = this.state.files[fileID].name
      let message = `Failed to upload ${fileName}`
      if (typeof error === 'object' && error.message) {
        message = `${message}: ${error.message}`
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

    // `remove-file` removes a file from `state.files`, for example when
    // a user decides not to upload particular file and clicks a button to remove it
    this.on('core:file-remove', (fileID) => {
      this.removeFile(fileID)
    })

    this.on('core:cancel-all', () => {
      // let updatedFiles = this.getState().files
      // updatedFiles = {}
      this.setState({files: {}})
    })

    this.on('core:upload-started', (fileID, upload) => {
      const updatedFiles = Object.assign({}, this.getState().files)
      const updatedFile = Object.assign({}, updatedFiles[fileID],
        Object.assign({}, {
          progress: Object.assign({}, updatedFiles[fileID].progress, {
            uploadStarted: Date.now()
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
      // this.calculateProgress(data)
      throttledCalculateProgress(data)
    })

    this.on('core:upload-success', (fileID, uploadResp, uploadURL) => {
      const updatedFiles = Object.assign({}, this.getState().files)
      const updatedFile = Object.assign({}, updatedFiles[fileID], {
        progress: Object.assign({}, updatedFiles[fileID].progress, {
          uploadComplete: true,
          // good or bad idea? setting the percentage to 100 if upload is successful,
          // so that if we lost some progress events on the way, its still marked “compete”?
          percentage: 100
        }),
        uploadURL: uploadURL
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

  info (message, type, duration) {
    const isComplexMessage = typeof message === 'object'

    this.setState({
      info: {
        isHidden: false,
        type: type || 'info',
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
    const newInfo = Object.assign({}, this.state.info, {
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
   * @return {String|Object} to log
   */
  log (msg, type) {
    if (!this.opts.debug) {
      return
    }

    if (type === 'error') {
      console.error(`LOG: ${msg}`)
      return
    }

    if (msg === `${msg}`) {
      console.log(`LOG: ${msg}`)
    } else {
      console.dir(msg)
    }

    global.uppyLog = global.uppyLog + '\n' + 'DEBUG LOG: ' + msg
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

    if (!this.state.currentUploads[uploadID]) {
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
      currentUploads: Object.assign({}, this.state.currentUploads, {
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
    const currentUploads = Object.assign({}, this.state.currentUploads)
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
    const uploadData = this.state.currentUploads[uploadID]
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
        const currentUpload = Object.assign({}, this.state.currentUploads[uploadID], {
          step: step
        })
        this.setState({
          currentUploads: Object.assign({}, this.state.currentUploads, {
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
      this.emit('core:success', fileIDs)

      this.removeUpload(uploadID)
    })
  }

    /**
   * Start an upload for all the files that are not currently being uploaded.
   *
   * @return {Promise}
   */
  upload (forceUpload) {
    const isMinNumberOfFilesReached = this.checkMinNumberOfFiles()
    if (!isMinNumberOfFilesReached) {
      return Promise.reject(new Error('Minimum number of files has not been reached'))
    }

    const beforeUpload = Promise.resolve()
      .then(() => this.opts.onBeforeUpload(this.state.files))

    return beforeUpload.catch((err) => {
      const message = typeof err === 'object' ? err.message : err
      this.info(message, 'error', 5000)
      return Promise.reject(new Error(`onBeforeUpload: ${message}`))
    }).then(() => {
      const waitingFileIDs = []
      Object.keys(this.state.files).forEach((fileID) => {
        const file = this.getFile(fileID)

        // TODO: replace files[file].isRemote with some logic
        //
        // filter files that are now yet being uploaded / haven’t been uploaded
        // and remote too

        if (forceUpload) {
          this.resetProgress()
          waitingFileIDs.push(file.id)
        } else if (!file.progress.uploadStarted || file.isRemote) {
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
