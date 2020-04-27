const chalk = require('chalk')
const escapeStringRegexp = require('escape-string-regexp')

const valuesToMask = []
/**
 * Adds a list of strings that should be masked by the logger.
 * This function can only be called once through out the life of the server.
 * @param {Array} maskables a list of strings to be masked
 */
exports.setMaskables = (maskables) => {
  maskables.forEach((i) => {
    valuesToMask.push(escapeStringRegexp(i))
  })

  Object.freeze(valuesToMask)
}

/**
 * INFO level log
 * @param {string} msg the message to log
 * @param {string=} tag a unique tag to easily search for this message
 * @param {string=} traceId a unique id to easily trace logs tied to a request
 */
exports.info = (msg, tag, traceId) => {
  log(msg, tag, 'info', traceId)
}

/**
 * WARN level log
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
 * @param {string | Error} msg the message to log
 * @param {string=} tag a unique tag to easily search for this message
 * @param {string=} traceId a unique id to easily trace logs tied to a request
 */
exports.error = (msg, tag, traceId) => {
  // @ts-ignore
  log(msg, tag, 'error', traceId, chalk.bold.red)
}

/**
 * DEBUG level log
 * @param {string} msg the message to log
 * @param {string=} tag a unique tag to easily search for this message
 * @param {string=} traceId a unique id to easily trace logs tied to a request
 */
exports.debug = (msg, tag, traceId) => {
  if (process.env.NODE_ENV !== 'production') {
    log(msg, tag, 'debug', traceId)
  }
}

/**
 * message log
 * @param {string | Error} msg the message to log
 * @param {string} tag a unique tag to easily search for this message
 * @param {string} level error | info | debug
 * @param {function=} color function to display the log in appropriate color
 * @param {string=} id a unique id to easily trace logs tied to a request
 */
const log = (msg, tag, level, id, color) => {
  const time = new Date().toISOString()
  tag = tag || ''
  id = id || ''
  const whitespace = tag && id ? ' ' : ''
  color = color || ((message) => message)
  msg = typeof msg === 'string' ? maskMessage(msg) : msg
  // exclude msg from template string so values such as error objects
  // can be well formatted
  console.log(color(`companion: ${time} [${level}] ${id}${whitespace}${tag}`), color(msg))
}

/**
 * Mask the secret content of a message
 * @param {string} msg the message whose content should be masked
 * @returns {string}
 */
const maskMessage = (msg) => {
  for (const toBeMasked of valuesToMask) {
    const toBeReplaced = new RegExp(toBeMasked, 'gi')
    msg = msg.replace(toBeReplaced, '******')
  }
  return msg
}
