import type { h } from 'preact'

// We're using a generic because languages have different plural rules.
export interface Locale<T extends number = number> {
  strings: Record<string, string | Record<T, string>>
  pluralize: (n: number) => T
}

export type OptionalPluralizeLocale<T extends number = number> =
  | (Omit<Locale<T>, 'pluralize'> & Partial<Pick<Locale<T>, 'pluralize'>>)
  | undefined

export type LocaleStrings<T extends NonNullable<OptionalPluralizeLocale>> = {
  strings: Partial<T['strings']>
}

export type I18n = Translator['translate']

type Options = {
  smart_count?: number
} & {
  [key: string]: string | number | h.JSX.Element
}

function insertReplacement(
  source: Array<string | unknown>,
  rx: RegExp,
  replacement: string,
): Array<string | unknown> {
  const newParts: Array<string | unknown> = []
  source.forEach((chunk) => {
    // When the source contains multiple placeholders for interpolation,
    // we should ignore chunks that are not strings, because those
    // can be JSX objects and will be otherwise incorrectly turned into strings.
    // Without this condition we’d get this: [object Object] hello [object Object] my <button>
    if (typeof chunk !== 'string') {
      return newParts.push(chunk)
    }

    return rx[Symbol.split](chunk).forEach((raw, i, list) => {
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

/**
 * Takes a string with placeholder variables like `%{smart_count} file selected`
 * and replaces it with values from options `{smart_count: 5}`
 *
 * @license https://github.com/airbnb/polyglot.js/blob/master/LICENSE
 * taken from https://github.com/airbnb/polyglot.js/blob/master/lib/polyglot.js#L299
 *
 * @param phrase that needs interpolation, with placeholders
 * @param options with values that will be used to replace placeholders
 */
function interpolate(
  phrase: string,
  options?: Options,
): Array<string | unknown> {
  const dollarRegex = /\$/g
  const dollarBillsYall = '$$$$'
  let interpolated: Array<string | unknown> = [phrase]

  if (options == null) return interpolated

  for (const arg of Object.keys(options)) {
    if (arg !== '_') {
      // Ensure replacement value is escaped to prevent special $-prefixed
      // regex replace tokens. the "$$$$" is needed because each "$" needs to
      // be escaped with "$" itself, and we need two in the resulting output.
      let replacement = options[arg]
      if (typeof replacement === 'string') {
        replacement = dollarRegex[Symbol.replace](replacement, dollarBillsYall)
      }
      // We create a new `RegExp` each time instead of using a more-efficient
      // string replace so that the same argument can be replaced multiple times
      // in the same phrase.
      interpolated = insertReplacement(
        interpolated,
        new RegExp(`%\\{${arg}\\}`, 'g'),
        replacement as string,
      )
    }
  }

  return interpolated
}

const defaultOnMissingKey = (key: string): void => {
  throw new Error(`missing string: ${key}`)
}

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
 */
export default class Translator {
  readonly locale: Locale

  constructor(
    locales: Locale | Array<OptionalPluralizeLocale | undefined>,
    { onMissingKey = defaultOnMissingKey } = {},
  ) {
    this.locale = {
      strings: {},
      pluralize(n: number): 0 | 1 {
        if (n === 1) {
          return 0
        }
        return 1
      },
    }

    if (Array.isArray(locales)) {
      locales.forEach(this.#apply, this)
    } else {
      this.#apply(locales)
    }

    this.#onMissingKey = onMissingKey
  }

  #onMissingKey

  #apply(locale?: OptionalPluralizeLocale): void {
    if (!locale?.strings) {
      return
    }

    const prevLocale = this.locale
    Object.assign(this.locale, {
      strings: { ...prevLocale.strings, ...locale.strings },
      pluralize: locale.pluralize || prevLocale.pluralize,
    })
  }

  /**
   * Public translate method
   *
   * @param key
   * @param options with values that will be used later to replace placeholders in string
   * @returns string translated (and interpolated)
   */
  translate(key: string, options?: Options): string {
    return this.translateArray(key, options).join('')
  }

  /**
   * Get a translation and return the translated and interpolated parts as an array.
   *
   * @returns The translated and interpolated parts, in order.
   */
  translateArray(key: string, options?: Options): Array<string | unknown> {
    let string = this.locale.strings[key]
    if (string == null) {
      this.#onMissingKey(key)
      string = key
    }
    const hasPluralForms = typeof string === 'object'

    if (hasPluralForms) {
      if (options && typeof options.smart_count !== 'undefined') {
        const plural = this.locale.pluralize(options.smart_count)
        return interpolate(string[plural], options)
      }
      throw new Error(
        'Attempted to use a string with plural forms, but no value was given for %{smart_count}',
      )
    }

    if (typeof string !== 'string') {
      throw new Error(`string was not a string`)
    }

    return interpolate(string, options)
  }
}
