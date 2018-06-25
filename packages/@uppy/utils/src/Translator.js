/**
 * Translates strings with interpolation & pluralization support.
 * Extensible with custom dictionaries and pluralization functions.
 *
 * Borrows heavily from and inspired by Polyglot https://github.com/airbnb/polyglot.js,
 * basically a stripped-down version of it. Differences: pluralization functions are not hardcoded
 * and can be easily added among with dictionaries, nested objects are used for pluralization
 * as opposed to `||||` delimeter
 *
 * Usage example: `translator.translate('files_chosen', {smart_count: 3})`
 *
 * @param {object} opts
 */
module.exports = class Translator {
  constructor (opts) {
    const defaultOptions = {
      locale: {
        strings: {},
        pluralize: function (n) {
          if (n === 1) {
            return 0
          }
          return 1
        }
      }
    }

    this.opts = Object.assign({}, defaultOptions, opts)
    this.locale = Object.assign({}, defaultOptions.locale, opts.locale)
  }

  /**
   * Takes a string with placeholder variables like `%{smart_count} file selected`
   * and replaces it with values from options `{smart_count: 5}`
   *
   * @license https://github.com/airbnb/polyglot.js/blob/master/LICENSE
   * taken from https://github.com/airbnb/polyglot.js/blob/master/lib/polyglot.js#L299
   *
   * @param {string} phrase that needs interpolation, with placeholders
   * @param {object} options with values that will be used to replace placeholders
   * @return {string} interpolated
   */
  interpolate (phrase, options) {
    const { split, replace } = String.prototype
    const dollarRegex = /\$/g
    const dollarBillsYall = '$$$$'
    let interpolated = [phrase]

    for (let arg in options) {
      if (arg !== '_' && options.hasOwnProperty(arg)) {
        // Ensure replacement value is escaped to prevent special $-prefixed
        // regex replace tokens. the "$$$$" is needed because each "$" needs to
        // be escaped with "$" itself, and we need two in the resulting output.
        var replacement = options[arg]
        if (typeof replacement === 'string') {
          replacement = replace.call(options[arg], dollarRegex, dollarBillsYall)
        }
        // We create a new `RegExp` each time instead of using a more-efficient
        // string replace so that the same argument can be replaced multiple times
        // in the same phrase.
        interpolated = insertReplacement(interpolated, new RegExp('%\\{' + arg + '\\}', 'g'), replacement)
      }
    }

    return interpolated

    function insertReplacement (source, rx, replacement) {
      const newParts = []
      source.forEach((chunk) => {
        split.call(chunk, rx).forEach((raw, i, list) => {
          if (raw !== '') {
            newParts.push(raw)
          }

          // Interlace with the `replacement` value
          if (i < list.length - 1) {
            newParts.push(replacement)
          }
        })
      })
      return newParts
    }
  }

  /**
   * Public translate method
   *
   * @param {string} key
   * @param {object} options with values that will be used later to replace placeholders in string
   * @return {string} translated (and interpolated)
   */
  translate (key, options) {
    return this.translateArray(key, options).join('')
  }

  /**
   * Get a translation and return the translated and interpolated parts as an array.
   * @param {string} key
   * @param {object} options with values that will be used to replace placeholders
   * @return {Array} The translated and interpolated parts, in order.
   */
  translateArray (key, options) {
    if (options && typeof options.smart_count !== 'undefined') {
      var plural = this.locale.pluralize(options.smart_count)
      return this.interpolate(this.opts.locale.strings[key][plural], options)
    }

    return this.interpolate(this.opts.locale.strings[key], options)
  }
}
