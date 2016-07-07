import Utils from '../core/Utils'
import Translator from '../core/Translator'
import prettyBytes from 'pretty-bytes'
import yo from 'yo-yo'
import ee from 'events'
import UppySocket from './UppySocket'

/**
 * Main Uppy core
 *
 * @param {object} opts general options, like locales, to show modal or not to show
 */
export default class Core {
  constructor (opts) {
    // set default options
    const defaultOptions = {
      // load English as the default locales
      locales: require('../locales/en_US.js'),
      autoProceed: true,
      debug: false
    }

    // Merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    // Dictates in what order different plugin types are ran:
    this.types = [ 'presetter', 'orchestrator', 'progressindicator', 'acquirer', 'uploader', 'presenter' ]

    this.type = 'core'

    // Container for different types of plugins
    this.plugins = {}

    this.translator = new Translator({locales: this.opts.locales})
    this.i18n = this.translator.translate.bind(this.translator)
    this.initSocket = this.initSocket.bind(this)

    this.emitter = new ee.EventEmitter()

    this.state = {
      files: {}
    }

    if (this.opts.debug) {
      // for debugging and testing
      global.UppyState = this.state
      global.uppyLog = ''
      global.UppyAddFile = this.addFile.bind(this)
    }
  }

  /**
   * Iterate on all plugins and run `update` on them. Called each time when state changes
   *
   */
  updateAll () {
    Object.keys(this.plugins).forEach((pluginType) => {
      this.plugins[pluginType].forEach((plugin) => {
        plugin.update()
      })
    })
  }

  /**
   * Updates state
   *
   * @param {newState} object
   */
  setState (newState) {
    this.log('Setting state to: ')
    this.log(newState)
    this.state = Object.assign({}, this.state, newState)
    this.updateAll()
  }

  /**
   * Gets current state, making sure to make a copy of the state object and pass that,
   * instead of an actual reference to `this.state`
   *
   */
  getState () {
    return this.state
  }

  addMeta (meta, fileID) {
    if (typeof fileID === 'undefined') {
      const updatedFiles = Object.assign({}, this.state.files)
      for (let file in updatedFiles) {
        updatedFiles[file].meta = meta
      }
      this.setState({files: updatedFiles})
    }
  }

  addFile (file) {
    const updatedFiles = Object.assign({}, this.state.files)

    const fileType = file.type.split('/')
    const fileTypeGeneral = fileType[0]
    const fileTypeSpecific = fileType[1]
    const fileID = Utils.generateFileID(file.name)

    updatedFiles[fileID] = {
      source: file.source || '',
      id: fileID,
      name: file.name,
      type: {
        general: fileTypeGeneral,
        specific: fileTypeSpecific
      },
      data: file.data,
      progress: 0,
      totalSize: prettyBytes(file.data.size),
      uploadedSize: 0,
      isRemote: file.isRemote || false,
      remote: file.remote
    }

    this.setState({files: updatedFiles})

    if (fileTypeGeneral === 'image') {
      // this.addImgPreviewToFile(updatedFiles[fileID])
      Utils.readImage(updatedFiles[fileID].data, (imgEl) => {
        const newImageWidth = 200
        const newImageHeight = Utils.getProportionalImageHeight(imgEl, newImageWidth)
        const resizedImgSrc = Utils.resizeImage(imgEl, newImageWidth, newImageHeight)

        const updatedFiles = Object.assign({}, this.state.files)
        updatedFiles[fileID].previewEl = yo`<img alt="${file.name}" src="${resizedImgSrc}">`
        this.setState({files: updatedFiles})
      })
    }

    if (this.opts.autoProceed) {
      this.emitter.emit('next')
    }
  }

  /**
   * Registers listeners for all global actions, like:
   * `file-add`, `file-remove`, `upload-progress`, `reset`
   *
   */
  actions () {
    this.emitter.on('file-add', (data) => {
      this.addFile(data)
    })

    // `remove-file` removes a file from `state.files`, for example when
    // a user decides not to upload particular file and clicks a button to remove it
    this.emitter.on('file-remove', (fileID) => {
      const updatedFiles = Object.assign({}, this.state.files)
      delete updatedFiles[fileID]
      this.setState({files: updatedFiles})
    })

    this.emitter.on('upload-progress', (data) => {
      let percentage = (data.bytesUploaded / data.bytesTotal * 100).toFixed(2)
      percentage = Math.round(percentage)

      const updatedFiles = Object.assign({}, this.state.files)
      updatedFiles[data.id].progress = percentage
      updatedFiles[data.id].uploadedSize = prettyBytes(data.bytesUploaded)

      const inProgress = Object.keys(updatedFiles).map((file) => {
        return file.progress !== 0
      })

      // calculate total progress, using the number of files currently uploading,
      // multiplied by 100 and the summ of individual progress of each file
      const progressMax = Object.keys(inProgress).length * 100
      let progressAll = 0
      Object.keys(updatedFiles).forEach((file) => {
        progressAll = progressAll + updatedFiles[file].progress
      })

      const totalProgress = progressAll * 100 / progressMax

      this.setState({
        totalProgress: totalProgress,
        files: updatedFiles
      })
    })

    // `upload-success` adds successfully uploaded file to `state.uploadedFiles`
    // and fires `remove-file` to remove it from `state.files`
    this.emitter.on('upload-success', (file) => {
      const updatedFiles = Object.assign({}, this.state.files)
      updatedFiles[file.id] = file
      this.setState({files: updatedFiles})
      // this.log(this.state.uploadedFiles)
      // this.emitter.emit('file-remove', file.id)
    })
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
 * Logs stuff to console, only if `debug` is set to true. Silent in production.
 *
 * @return {String|Object} to log
 */
  log (msg) {
    if (!this.opts.debug) {
      return
    }
    if (msg === `${msg}`) {
      console.log(`LOG: ${msg}`)
    } else {
      console.log('LOG↓')
      console.dir(msg)
    }
    global.uppyLog = global.uppyLog + '\n' + 'DEBUG LOG: ' + msg
  }

/**
 * Runs all plugins of the same type in parallel
 *
 * @param {string} type that wants to set progress
 * @param {array} files
 * @return {Promise} of all methods
 */
  runType (type, method, files) {
    const methods = this.plugins[type].map(
      (plugin) => plugin[method](Utils.flatten(files))
    )

    return Promise.all(methods)
      .catch((error) => console.error(error))
  }

/**
 * Runs a waterfall of runType plugin packs, like so:
 * All preseters(data) --> All acquirers(data) --> All uploaders(data) --> done
 */
  run () {
    this.log('Core is run, initializing actions, installing plugins...')

    this.actions()

    // Forse set `autoProceed` option to false if there are multiple selector Plugins active
    if (this.plugins.acquirer && this.plugins.acquirer.length > 1) {
      this.opts.autoProceed = false
    }

    // Install all plugins
    Object.keys(this.plugins).forEach((pluginType) => {
      this.plugins[pluginType].forEach((plugin) => {
        plugin.install()
      })
    })

    return

    // Each Plugin can have `run` and/or `install` methods.
    // `install` adds event listeners and does some non-blocking work, useful for `progressindicator`,
    // `run` waits for the previous step to finish (user selects files) before proceeding
    // ['install', 'run'].forEach((method) => {
    //   // First we select only plugins of current type,
    //   // then create an array of runType methods of this plugins
    //   const typeMethods = this.types.filter((type) => this.plugins[type])
    //     .map((type) => this.runType.bind(this, type, method))
    //   // Run waterfall of typeMethods
    //   return Utils.promiseWaterfall(typeMethods)
    //     .then((result) => {
    //       // If results are empty, don't log upload results. Hasn't run yet.
    //       if (result[0] !== undefined) {
    //         this.log(result)
    //         this.log('Upload result -> success!')
    //         return result
    //       }
    //     })
    //     .catch((error) => this.log('Upload result -> failed:', error))
    // })
  }

  initSocket (opts) {
    if (!this.socket) {
      this.socket = new UppySocket(opts)
    }

    return this.socket
  }
}
