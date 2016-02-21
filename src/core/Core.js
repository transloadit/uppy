import Utils from '../core/Utils'
import Translator from '../core/Translator'
import ee from 'event-emitter'

/**
 * Main Uppy core
 *
 * @param {object} opts general options, like locale, to show modal or not to show
 */
export default class Core {
  constructor (opts) {
    // set default options
    const defaultOptions = {
      // load English as the default locale
      locale: require('../locale/en_US.js'),
      autoProceed: true,
      debug: false
    }

    // Merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    // Dictates in what order different plugin types are ran:
    this.types = [ 'presetter', 'view', 'progress', 'selecter', 'uploader' ]

    this.type = 'core'

    // Container for different types of plugins
    this.plugins = {}

    this.translator = new Translator({locale: this.opts.locale})
    this.i18n = this.translator.translate.bind(this.translator)
    // console.log(this.i18n('filesChosen', {smart_count: 3}))

    // Set up an event EventEmitter
    this.emitter = ee()
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
    this.plugins[plugin.type] = this.plugins[plugin.type] || []

    if (!plugin.constructor.name) {
      throw new Error('Your plugin must have a name')
    }
    if (!plugin.type) {
      throw new Error('Your plugin must have a type')
    }

    let existsPluginAlready = this.getPlugin(plugin.constructor.name)
    if (existsPluginAlready) {
      let msg = `Already found a plugin named '${existsPluginAlready.name}'. `
      msg += `Tried to use: '${plugin.constructor.name}'. `
      msg += 'Uppy is currently limited to running one of every plugin. '
      msg += 'Share your use case with us over at '
      msg += 'https://github.com/transloadit/uppy/issues/ '
      msg += 'if you want us to reconsider. '
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
    this.iteratePlugins(plugin => {
      if (plugin.constructor.name === name) {
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
 * Sets plugin’s progress, like for uploads
 *
 * @param {object} plugin that wants to set progress
 * @param {integer} percentage
 * @return {object} self for chaining
 */
  setProgress (plugin, percentage) {
    // Any plugin can call this via `this.core.setProgress(this, precentage)`
    console.log(plugin.type + ' plugin ' + plugin.name + ' set the progress to ' + percentage)
    return this
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
      console.log(`DEBUG LOG: ${msg}`)
    } else {
      console.log(`DEBUG LOG`)
      console.dir(msg)
    }
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
      plugin => plugin[method](files)
    )

    return Promise.all(methods)
      .catch(error => console.error(error))
  }

/**
 * Runs a waterfall of runType plugin packs, like so:
 * All preseters(data) --> All selecters(data) --> All uploaders(data) --> done
 */
  run () {
    this.log({
      class: this.constructor.name,
      method: 'run'
    })

    console.log('yo')

    // Forse set `autoProceed` option to false if there are multiple selector Plugins active
    if (this.plugins.selecter && this.plugins.selecter.length > 1) {
      this.opts.autoProceed = false
    }

    // Each Plugin can have `run` and/or `install` methods.
    // `install` adds event listeners and does some non-blocking work, useful for `progress`,
    // `run` waits for the previous step to finish (user selects files) before proceeding
    ['install', 'run'].forEach(method => {
      // First we select only plugins of current type,
      // then create an array of runType methods of this plugins
      const typeMethods = this.types.filter(type => {
        return this.plugins[type]
      }).map(type => this.runType.bind(this, type, method))

      // Run waterfall of typeMethods
      return Utils.promiseWaterfall(typeMethods)
        .then(result => { return result })
        .catch(error => console.error(error))
    })
  }
}
