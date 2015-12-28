import Utils from '../core/Utils';

/**
* Main Uppy core
*
*/
export default class Core {
  constructor(opts) {

    // set default options
    const defaultOptions = {
      // locale: 'en_US'
    };

    // Merge default options with the ones set by user
    this.opts = defaultOptions;
    Object.assign(this.opts, opts);

    // Dictates in what order different plugin types are ran:
    this.types = [ 'presetter', 'selecter', 'uploader' ];

    this.type = 'core';

    // Container for different types of plugins
    this.plugins = {};
  }

  /**
 * Registers a plugin with Core
 *
 * @param {Plugin} Plugin object
 * @param {opts} options object that will be passed to Plugin later
 * @returns {object} self for chaining
 */
  use(Plugin, opts) {
    // Instantiate
    var plugin = new Plugin(this, opts);
    this.plugins[plugin.type] = this.plugins[plugin.type] || [];
    this.plugins[plugin.type].push(plugin);

    return this;
  }

  /**
 * Translate a string into the selected language (this.locale).
 * Return the original string if locale is undefined
 *
 * @param {string} string that needs translating
 * @returns {string} translated string
 */
  translate(string) {
    // const currentLocale = this.opts.locale;
    // console.log(currentLocale);
    // const dictionaryPath = '../locale/en_US.json';
    // const dictionary = require('../locale/en_US.json');
    const dictionary = this.opts.locale;

    // if locale is unspecified, return the original string
    if (!dictionary) {
      return string;
    }

    const translatedString = dictionary[string];
    return translatedString;
  }

  /**
 * Sets plugin’s progress, for uploads for example
 *
 * @param {plugin} plugin that want to set progress
 * @param {percentage} integer
 * @returns {object} self for chaining
 */
  setProgress(plugin, percentage) {
    // Any plugin can call this via `this.core.setProgress(this, precentage)`
    console.log(plugin.type + ' plugin ' + plugin.name + ' set the progress to ' + percentage);
    return this;
  }

  /**
 * Runs all plugins of the same type in parallel
 */
  runType(type, files) {
    const methods = this.plugins[type].map(
      plugin => plugin.run.call(plugin, files)
    );

    return Promise.all(methods);
  }

  /**
  * Runs a waterfall of runType plugin packs, like so:
  * All preseters(data) --> All selecters(data) --> All uploaders(data) --> done
  */
  run() {
    console.log({
      class  : 'Core',
      method : 'run'
    });

    // First we select only plugins of current type,
    // then create an array of runType methods of this plugins
    let typeMethods = this.types.filter(type => {
      return this.plugins[type];
    }).map(type => this.runType.bind(this, type));

    Utils.promiseWaterfall(typeMethods)
      .then((result) => console.log(result))
      .catch((error) => console.error(error));
  }
}
