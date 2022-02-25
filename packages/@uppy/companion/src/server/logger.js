const chalk = require('chalk')
const escapeStringRegexp = require('escape-string-regexp')
const util = require('util')

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
 * @param {string | Error} msg the message to log
 * @param {string} tag a unique tag to easily search for this message
 * @param {string} level error | info | debug
 * @param {string=} id a unique id to easily trace logs tied to a request
 * @param {Function=} color function to display the log in appropriate color
 * @param {boolean=} shouldLogStackTrace when set to true, errors will be logged with their stack trace
 */
const log = (msg, tag = '', level, id = '', color = (message) => message, shouldLogStackTrace) => {
  const time = new Date().toISOString()
  const whitespace = tag && id ? ' ' : ''

  function logMsg (msg2) {
    let msgString = typeof msg2 === 'string' ? msg2 : util.inspect(msg2)
    msgString = maskMessage(msgString)
    // eslint-disable-next-line no-console
    console.log(color(`companion: ${time} [${level}] ${id}${whitespace}${tag}`), color(msgString))
  }

  if (msg instanceof Error) {
    // Not sure why it only logs the stack without the message, but this is how the code was originally
    if (shouldLogStackTrace && typeof msg.stack === 'string') {
      logMsg(msg.stack)
      return
    }

    // We don't want to log stack trace (this is how the code was originally)
    logMsg(String(msg))
    return
  }

  logMsg(msg)
}

/**
 * INFO level log
 *
 * @param {string} msg the message to log
 * @param {string=} tag a unique tag to easily search for this message
 * @param {string=} traceId a unique id to easily trace logs tied to a request
 */
exports.info = (msg, tag, traceId) => {
  log(msg, tag, 'info', traceId)
}

/**
 * WARN level log
 *
 * @param {string} msg the message to log
 * @param {string=} tag a unique tag to easily search for this message
 * @param {string=} traceId a unique id to easily trace logs tied to a request
 */
exports.warn = (msg, tag, traceId) => {
  // @ts-ignore
  log(msg, tag, 'warn', traceId, chalk.bold.yellow)
}

/**
 * ERROR level log
 *
 * @param {string | Error} msg the message to log
 * @param {string=} tag a unique tag to easily search for this message
 * @param {string=} traceId a unique id to easily trace logs tied to a request
 * @param {boolean=} shouldLogStackTrace when set to true, errors will be logged with their stack trace
 */
exports.error = (msg, tag, traceId, shouldLogStackTrace) => {
  // @ts-ignore
  log(msg, tag, 'error', traceId, chalk.bold.red, shouldLogStackTrace)
}

/**
 * DEBUG level log
 *
 * @param {string} msg the message to log
 * @param {string=} tag a unique tag to easily search for this message
 * @param {string=} traceId a unique id to easily trace logs tied to a request
 */
exports.debug = (msg, tag, traceId) => {
  if (process.env.NODE_ENV !== 'production') {
    // @ts-ignore
    log(msg, tag, 'debug', traceId, chalk.bold.blue)
  }
}
