const Utils = require('../core/Utils')
const Translator = require('../core/Translator')
const UppySocket = require('./UppySocket')
const ee = require('namespace-emitter')
const throttle = require('lodash.throttle')
// const en_US = require('../locales/en_US')
// const deepFreeze = require('deep-freeze-strict')

/**
 * Main Uppy core
 *
 * @param {object} opts general options, like locales, to show modal or not to show
 */
class Uppy {
  constructor (opts) {
    // set default options
    const defaultOptions = {
      // load English as the default locale
      // locale: en_US,
      autoProceed: true,
      debug: false
    }

    // Merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    // // Dictates in what order different plugin types are ran:
    // this.types = [ 'presetter', 'orchestrator', 'progressindicator',
    //                 'acquirer', 'modifier', 'uploader', 'presenter', 'debugger']

    // Container for different types of plugins
    this.plugins = {}

    this.translator = new Translator({locale: this.opts.locale})
    this.i18n = this.translator.translate.bind(this.translator)
    this.getState = this.getState.bind(this)
    this.updateMeta = this.updateMeta.bind(this)
    this.initSocket = this.initSocket.bind(this)
    this.log = this.log.bind(this)
    this.addFile = this.addFile.bind(this)
    this.calculateProgress = this.calculateProgress.bind(this)

    this.bus = this.emitter = ee()
    this.on = this.bus.on.bind(this.bus)
    this.emit = this.bus.emit.bind(this.bus)

    this.preProcessors = []
    this.uploaders = []
    this.postProcessors = []

    this.state = {
      files: {},
      capabilities: {
        resumableUploads: false
      },
      progress: {
        state: 'waiting'
      },
      totalProgress: 0
    }

    // for debugging and testing
    this.updateNum = 0
    if (this.opts.debug) {
      global.UppyState = this.state
      global.uppyLog = ''
      global.UppyAddFile = this.addFile.bind(this)
      global._Uppy = this
    }
  }

  /**
   * Iterate on all plugins and run `update` on them. Called each time state changes
   *
   */
  updateAll (state) {
    Object.keys(this.plugins).forEach((pluginType) => {
      this.plugins[pluginType].forEach((plugin) => {
        plugin.update(state)
      })
    })
  }

  /**
   * Updates state
   *
   * @param {newState} object
   */
  setState (stateUpdate) {
    const newState = Object.assign({}, this.state, stateUpdate)
    this.emit('core:state-update', this.state, newState, stateUpdate)

    this.state = newState
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

  updateMeta (data, fileID) {
    const updatedFiles = Object.assign({}, this.getState().files)
    const newMeta = Object.assign({}, updatedFiles[fileID].meta, data)
    updatedFiles[fileID] = Object.assign({}, updatedFiles[fileID], {
      meta: newMeta
    })
    this.setState({files: updatedFiles})
  }

  addFile (file) {
    const updatedFiles = Object.assign({}, this.state.files)

    const fileName = file.name || 'noname'
    const fileType = Utils.getFileType(file)
    const fileTypeGeneral = fileType[0]
    const fileTypeSpecific = fileType[1]
    const fileExtension = Utils.getFileNameAndExtension(fileName)[1]
    const isRemote = file.isRemote || false

    const fileID = Utils.generateFileID(fileName)

    const newFile = {
      source: file.source || '',
      id: fileID,
      name: fileName,
      extension: fileExtension || '',
      meta: {
        name: fileName
      },
      type: {
        general: fileTypeGeneral,
        specific: fileTypeSpecific
      },
      data: file.data,
      progress: {
        percentage: 0,
        uploadComplete: false,
        uploadStarted: false
      },
      size: file.data.size || 'N/A',
      isRemote: isRemote,
      remote: file.remote || '',
      preview: file.preview
    }

    if (fileTypeGeneral === 'image' && !isRemote) {
      newFile.preview = Utils.getThumbnail(file)
    }

    updatedFiles[fileID] = newFile
    this.setState({files: updatedFiles})

    this.bus.emit('file-added', fileID)
    this.log(`Added file: ${fileName}, ${fileID}, mime type: ${fileType}`)

    if (this.opts.autoProceed && !this.scheduledAutoProceed) {
      this.scheduledAutoProceed = setTimeout(() => {
        this.scheduledAutoProceed = null
        this.upload()
          .catch((err) => {
            console.error(err.stack || err.message)
          })
        // this.bus.emit('core:upload')
      }, 4)
    }
  }

  removeFile (fileID) {
    const updatedFiles = Object.assign({}, this.getState().files)
    delete updatedFiles[fileID]
    this.setState({files: updatedFiles})
    this.calculateTotalProgress()
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

    const totalProgress = Math.floor((progressAll * 100 / progressMax).toFixed(2))

    this.setState({
      totalProgress: totalProgress
    })

    // if (totalProgress === 100) {
    //   const completeFiles = Object.keys(updatedFiles).filter((file) => {
    //     // this should be `uploadComplete`
    //     return updatedFiles[file].progress.percentage === 100
    //   })
    //   this.emit('core:success', completeFiles.length)
    // }
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

    this.on('core:file-add', (data) => {
      this.addFile(data)
    })

    // `remove-file` removes a file from `state.files`, for example when
    // a user decides not to upload particular file and clicks a button to remove it
    this.on('core:file-remove', (fileID) => {
      this.removeFile(fileID)
    })

    this.on('core:cancel-all', () => {
      const files = this.getState().files
      Object.keys(files).forEach((file) => {
        this.removeFile(files[file].id)
      })
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

      // Preprocessing should be complete by now.
      if (updatedFile.progress.preprocess) {
        delete updatedFile.progress.preprocess
      }

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

      if (this.getState().totalProgress === 100) {
        const completeFiles = Object.keys(updatedFiles).filter((file) => {
          return updatedFiles[file].progress.uploadComplete
        })
        this.emit('core:upload-complete', completeFiles.length)
      }
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

      this.setState({
        files: files
      })
    })
    this.on('core:postprocess-progress', (fileID, progress) => {
      const files = Object.assign({}, this.getState().files)
      files[fileID] = Object.assign({}, files[fileID], {
        progress: Object.assign({}, files[fileID].progress, {
          postprocess: progress
        })
      })

      this.setState({
        files: files
      })
    })

    // show informer if offline
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.isOnline(true))
      window.addEventListener('offline', () => this.isOnline(false))
      setTimeout(() => this.isOnline(), 3000)
    }
  }

  isOnline (status) {
    const online = status || window.navigator.onLine
    if (!online) {
      this.emit('is-offline')
      this.emit('informer', 'No internet connection', 'error', 0)
      this.wasOffline = true
    } else {
      this.emit('is-online')
      if (this.wasOffline) {
        this.emit('back-online')
        this.emit('informer', 'Connected!', 'success', 3000)
        this.wasOffline = false
      }
    }
  }

/**
 * Registers a plugin with Core
 *
 * @param {Class} Plugin object
 * @param {Object} options object that will be passed to Plugin later
 * @return {Object} self for chaining
 */
  use (Plugin, opts) {
    // Instantiate
    const plugin = new Plugin(this, opts)
    const pluginName = plugin.id
    this.plugins[plugin.type] = this.plugins[plugin.type] || []

    if (!pluginName) {
      throw new Error('Your plugin must have a name')
    }

    if (!plugin.type) {
      throw new Error('Your plugin must have a type')
    }

    let existsPluginAlready = this.getPlugin(pluginName)
    if (existsPluginAlready) {
      let msg = `Already found a plugin named '${existsPluginAlready.name}'.
        Tried to use: '${pluginName}'.
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
    this.iteratePlugins((plugin) => {
      plugin.uninstall()
    })

    if (this.socket) {
      this.socket.close()
    }
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
    if (msg === `${msg}`) {
      console.log(`LOG: ${msg}`)
    } else {
      console.dir(msg)
    }

    if (type === 'error') {
      console.error(`LOG: ${msg}`)
    }

    global.uppyLog = global.uppyLog + '\n' + 'DEBUG LOG: ' + msg
  }

  initSocket (opts) {
    if (!this.socket) {
      this.socket = new UppySocket(opts)
    }

    return this.socket
  }

  // installAll () {
  //   Object.keys(this.plugins).forEach((pluginType) => {
  //     this.plugins[pluginType].forEach((plugin) => {
  //       plugin.install(this)
  //     })
  //   })
  // }

/**
 * Initializes actions, installs all plugins (by iterating on them and calling `install`), sets options
 *
 */
  run () {
    this.log('Core is run, initializing actions...')

    this.actions()

    // Forse set `autoProceed` option to false if there are multiple selector Plugins active
    // if (this.plugins.acquirer && this.plugins.acquirer.length > 1) {
    //   this.opts.autoProceed = false
    // }

    // Install all plugins
    // this.installAll()

    return
  }

  upload () {
    let promise = Promise.resolve()

    this.emit('core:upload')

    const waitingFileIDs = Object.keys(this.state.files)
      .map(getFile, this)
      .filter(isFileWaiting)
      .map(toFileID)
    function getFile (fileID) {
      return this.state.files[fileID]
    }
    function isFileWaiting (file) {
      // TODO: replace files[file].isRemote with some logic
      //
      // filter files that are now yet being uploaded / haven’t been uploaded
      // and remote too
      return !file.progress.uploadStarted || file.isRemote
    }
    function toFileID (file) {
      return file.id
    }

    ;[].concat(
      () => this.emit('core:preprocessing'),
      this.preProcessors,
      () => this.emit('core:uploading'),
      this.uploaders,
      () => this.emit('core:postprocessing'),
      this.postProcessors
    ).forEach((fn) => {
      promise = promise.then(() => fn(waitingFileIDs))
    })

    // Not returning the `catch`ed promise, because we still want to return a rejected
    // promise from this method if the upload failed.
    promise.catch((err) => {
      this.emit('core:error', err)
    })

    return promise.then(() => {
      this.emit('core:success')
    })
  }
}

module.exports = function (opts) {
  if (!(this instanceof Uppy)) {
    return new Uppy(opts)
  }
}
