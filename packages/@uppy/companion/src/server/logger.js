const chalk = require('chalk')
const escapeStringRegexp = require('escape-string-regexp')
const util = require('node:util')
const { ProviderApiError, ProviderAuthError } = require('./provider/error')

const valuesToMask = []
/**
 * Adds a list of strings that should be masked by the logger.
 * This function can only be called once through out the life of the server.
 *
 * @param {Array} maskables a list of strings to be masked
 */
exports.setMaskables = (maskables) => {
  maskables.forEach((i) => {
    valuesToMask.push(escapeStringRegexp(i))
  })

  Object.freeze(valuesToMask)
}

/**
 * Mask the secret content of a message
 *
 * @param {string} msg the message whose content should be masked
 * @returns {string}
 */
function maskMessage (msg) {
  let out = msg
  for (const toBeMasked of valuesToMask) {
    const toBeReplaced = new RegExp(toBeMasked, 'gi')
    out = out.replace(toBeReplaced, '******')
  }
  return out
}

/**
 * message log
 *
 * @param {string | Error} arg the message or error to log
 * @param {string} tag a unique tag to easily search for this message
 * @param {string} level error | info | debug
 * @param {string} [id] a unique id to easily trace logs tied to a request
 * @param {Function} [color] function to display the log in appropriate color
 */
const log = (arg, tag = '', level, id = '', color = (message) => message) => {
  const time = new Date().toISOString()
  const whitespace = tag && id ? ' ' : ''

  function msgToString () {
    // We don't need to log stack trace on special errors that we ourselves have produced
    // (to reduce log noise)
    if ((arg instanceof ProviderApiError || arg instanceof ProviderAuthError) && typeof arg.message === 'string') {
      return arg.message
    }
    if (typeof arg === 'string') return arg
    return util.inspect(arg)
  }

  const msgString = msgToString()
  const masked = maskMessage(msgString)
  // eslint-disable-next-line no-console
  console.log(color(`companion: ${time} [${level}] ${id}${whitespace}${tag}`), color(masked))
}

/**
 * INFO level log
 *
 * @param {string} msg the message to log
 * @param {string} [tag] a unique tag to easily search for this message
 * @param {string} [traceId] a unique id to easily trace logs tied to a request
 */
exports.info = (msg, tag, traceId) => {
  log(msg, tag, 'info', traceId)
}

/**
 * WARN level log
 *
 * @param {string} msg the message to log
 * @param {string} [tag] a unique tag to easily search for this message
 * @param {string} [traceId] a unique id to easily trace logs tied to a request
 */
exports.warn = (msg, tag, traceId) => {
  // @ts-ignore
  log(msg, tag, 'warn', traceId, chalk.bold.yellow)
}

/**
 * ERROR level log
 *
 * @param {string | Error} msg the message to log
 * @param {string} [tag] a unique tag to easily search for this message
 * @param {string} [traceId] a unique id to easily trace logs tied to a request
 */
exports.error = (msg, tag, traceId) => {
  // @ts-ignore
  log(msg, tag, 'error', traceId, chalk.bold.red)
}

/**
 * DEBUG level log
 *
 * @param {string} msg the message to log
 * @param {string} [tag] a unique tag to easily search for this message
 * @param {string} [traceId] a unique id to easily trace logs tied to a request
 */
exports.debug = (msg, tag, traceId) => {
  if (process.env.NODE_ENV !== 'production') {
    // @ts-ignore
    log(msg, tag, 'debug', traceId, chalk.bold.blue)
  }
}
