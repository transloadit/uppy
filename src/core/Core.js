import Utils from '../core/Utils'
import Translator from '../core/Translator'

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
      autoProceed: false
    }

    // Merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    // Dictates in what order different plugin types are ran:
    this.types = [ 'presetter', 'selecter', 'uploader' ]

    this.type = 'core'

    // Container for different types of plugins
    this.plugins = {}

    this.translator = new Translator({locale: this.opts.locale})
    this.i18n = this.translator.translate.bind(this.translator)
    // console.log(this.i18n('filesChosen', {smart_count: 3}))
  }

/**
 * Registers a plugin with Core
 *
 * @param {Class} Plugin object
 * @param {object} options object that will be passed to Plugin later
 * @return {object} self for chaining
 */
  use (Plugin, opts) {
    // Instantiate
    const plugin = new Plugin(this, opts)
    this.plugins[plugin.type] = this.plugins[plugin.type] || []
    this.plugins[plugin.type].push(plugin)

    return this
  }

/**
 * Sets plugin’s progress, like for uploads
 *
 * @param {object} plugin that wants to set progress
 * @param {integer} percentage
 * @return {object} self for chaining
 */
  setProgress (plugin, percentage, element) {
    // Any plugin can call this via `this.core.setProgress(this, precentage)`
    console.log(plugin.type + ' plugin ' + plugin.name + ' set the progress to ' + percentage)
    return this
  }

  // @todo log function

/**
 * Runs all plugins of the same type in parallel
 *
 * @param {string} type that wants to set progress
 * @param {array} files
 * @return {Promise} of all methods
 */
  runType (type, files) {
    const methods = this.plugins[type].map(
      plugin => plugin.run(files)
    )

    return Promise.all(methods)
      .catch((error) => console.error(error))
  }

/**
 * Runs a waterfall of runType plugin packs, like so:
 * All preseters(data) --> All selecters(data) --> All uploaders(data) --> done
 */
  run () {
    console.log({
      class: 'Core',
      method: 'run'
    })

    // Forse `autoProceed` option to false if there are multiple selector Plugins active
    if (this.plugins.selecter && this.plugins.selecter.length > 1) {
      this.opts.autoProceed = false
    }

    // First we select only plugins of current type,
    // then create an array of runType methods of this plugins
    let typeMethods = this.types.filter(type => {
      return this.plugins[type]
    }).map(type => this.runType.bind(this, type))

    Utils.promiseWaterfall(typeMethods)
      .then((result) => console.log(result))
      .catch((error) => console.error(error))
  }
}
