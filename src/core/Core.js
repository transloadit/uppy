import Utils from '../core/Utils';
// import Polyglot from 'node-polyglot';
import Translator from '../core/Translator';

/**
* Main Uppy core
*
* @param {object} opts general options, like locale, to show modal or not to show
*/
export default class Core {
  constructor(opts) {

    // set default options
    const defaultOptions = {
      // locale: 'en_US'
      // load English as the default locale
      locale: require('../locale/en_US.js')
    };

    // Merge default options with the ones set by user
    this.opts = defaultOptions;
    Object.assign(this.opts, opts);

    // Dictates in what order different plugin types are ran:
    this.types = [ 'presetter', 'selecter', 'uploader' ];

    this.type = 'core';

    // Container for different types of plugins
    this.plugins = {};

    // trying out Polyglot
    // this.polyglot = new Polyglot({locale: 'ru'});
    // this.polyglot.extend(this.opts.locale);
    // console.log(this.polyglot.t('files_chosen', {smart_count: 100}));

    // rolling out custom translation
    this.translator = new Translator({locale: this.opts.locale});
    console.log(this.translator.t('files_chosen', {smart_count: 3}));
  }

  /**
 * Registers a plugin with Core
 *
 * @param {Class} Plugin object
 * @param {object} options object that will be passed to Plugin later
 * @return {object} self for chaining
 */
  use(Plugin, opts) {
    // Instantiate
    const plugin = new Plugin(this, opts);
    this.plugins[plugin.type] = this.plugins[plugin.type] || [];
    this.plugins[plugin.type].push(plugin);

    return this;
  }

  /**
 * Translate a string into the selected language (this.locale).
 * Return the original string if locale is undefined
 *
 * @param {string} string that needs translating
 * @return {string} translated string
 */
  // translate(key, opts) {
  //   const dictionary = this.opts.locale;
  //
  //   // if locale is unspecified, or the translation is missing,
  //   // return the original string
  //   if (!dictionary || !dictionary[string]) {
  //     return string;
  //   }
  //
  //   return dictionary[string];
  // }

  /**
 * Sets plugin’s progress, for uploads for example
 *
 * @param {object} plugin that wants to set progress
 * @param {integer} percentage
 * @return {object} self for chaining
 */
  setProgress(plugin, percentage) {
    // Any plugin can call this via `this.core.setProgress(this, precentage)`
    console.log(plugin.type + ' plugin ' + plugin.name + ' set the progress to ' + percentage);
    return this;
  }

  /**
 * Runs all plugins of the same type in parallel
 *
 * @param {string} type that wants to set progress
 * @param {array} files
 * @return {Promise} of all methods
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

    // console.log(
    //   `translation is all like: ${this.translate('number_of_files_chosen', {number: 5})}`
    // );

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
