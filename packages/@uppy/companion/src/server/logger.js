const chalk = require('chalk')

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
  // exclude msg from template string so values such as error objects
  // can be well formatted
  console.log(color(`companion: ${time} [${level}] ${id}${whitespace}${tag}`), color(msg))
}
