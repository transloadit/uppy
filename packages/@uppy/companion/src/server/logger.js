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
 * @param {boolean=} shouldLogStackTrace when set to true, errors will be logged with their stack trace
 */
exports.error = (msg, tag, traceId, shouldLogStackTrace) => {
  // @ts-ignore
  log(msg, tag, 'error', traceId, chalk.bold.red, shouldLogStackTrace)
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
 * @param {boolean=} shouldLogStackTrace when set to true, errors will be logged with their stack trace
 */
const log = (msg, tag, level, id, color, shouldLogStackTrace) => {
  const time = new Date().toISOString()
  tag = tag || ''
  id = id || ''
  const whitespace = tag && id ? ' ' : ''
  color = color || ((message) => message)
  if (typeof msg === 'string') {
    msg = maskMessage(msg)
  } else if (msg && typeof msg.message === 'string') {
    msg.message = maskMessage(msg.message)
  }

  if (shouldLogStackTrace && msg instanceof Error && typeof msg.stack === 'string') {
    msg.stack = maskMessage(msg.stack)
    // exclude msg from template string so values such as error objects
    // can be well formatted
    console.log(color(`companion: ${time} [${level}] ${id}${whitespace}${tag}`), color(msg.stack))
    return
  }

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
