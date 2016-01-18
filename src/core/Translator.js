/**
* Translates strings with interpolation & pluralization support. Extensible with custom dictionaries and pluralization functions.
* Borrows heavily from and inspired by Polyglot https://github.com/airbnb/polyglot.js. Differences: pluralization functions are not hardcoded and can be easily added among with dictionaries.
* Usage example: translator.t('files_chosen', {smart_count: 3})
*
* @param {opts}
*/
export default class Translator {
  constructor(opts) {

    const defaultOptions = {
      // load English as the default locale
      // locale: require('../locale/en_US.js')
    };

    this.opts = defaultOptions;
    Object.assign(this.opts, opts);

    // console.log('--> and the locale will be...');
    // console.log(this.opts.locale);
  }

  /**
  * Takes a string with placeholder variables like '%{smart_count} file selected' and replaces it with values from options {smart_count: 5}
  *
  * @param {string} phrase that needs interpolation, with placeholders
  * @param {object} options with values that will be used to replace placeholders
  */
  interpolate(phrase, options) {
    const replace = String.prototype.replace;

    for (let arg in options) {
      if (arg !== '_' && options.hasOwnProperty(arg)) {
        // Ensure replacement value is escaped to prevent special $-prefixed
        // regex replace tokens. the "$$$$" is needed because each "$" needs to
        // be escaped with "$" itself, and we need two in the resulting output.
        var replacement = options[arg];
        if (typeof replacement === 'string') {
          replacement = replace.call(options[arg], dollarRegex, dollarBillsYall);
        }
        // We create a new `RegExp` each time instead of using a more-efficient
        // string replace so that the same argument can be replaced multiple times
        // in the same phrase.
        phrase = replace.call(phrase, new RegExp('%\\{'+arg+'\\}', 'g'), replacement);
      }
    }
    return phrase;
  }

  /**
  * Public translate method
  *
  * @param {string} key
  * @param {object} options with values that will be used later to replace placeholders in string
  * @return {string} translated (and interpolated)
  */
  t(key, options) {
    if (options.smart_count) {
      var plural = this.opts.locale.pluralize(options.smart_count);
      return this.interpolate(this.opts.locale.strings[key][plural], options);
    }

    return this.interpolate(this.opts.locale.strings[key], options);
  }

}
