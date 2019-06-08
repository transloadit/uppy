const chalk = require('chalk')

/**
 * INFO level log
 * @param {string} msg the message to log
 * @param {string=} tag a unique tag to easily search for this message
 */
exports.info = (msg, tag) => {
  log(msg, tag, 'info')
}

/**
 * WARN level log
 * @param {string} msg the message to log
 * @param {string=} tag a unique tag to easily search for this message
 */
exports.warn = (msg, tag) => {
  // @ts-ignore
  log(msg, tag, 'warn', chalk.bold.yellow)
}

/**
 * ERROR level log
 * @param {string | Error} msg the message to log
 * @param {string=} tag a unique tag to easily search for this message
 */
exports.error = (msg, tag) => {
  // @ts-ignore
  log(msg, tag, 'error', chalk.bold.red)
}

/**
 * DEBUG level log
 * @param {string} msg the message to log
 * @param {string=} tag a unique tag to easily search for this message
 */
exports.debug = (msg, tag) => {
  if (process.env.NODE_ENV !== 'production') {
    log(msg, tag, 'debug')
  }
}

/**
 * message log
 * @param {string | Error} msg the message to log
 * @param {string} tag a unique tag to easily search for this message
 * @param {string} level error | info | debug
 * @param {function=} color function to display the log in appropriate color
 */
const log = (msg, tag, level, color) => {
  const time = new Date().toISOString()
  color = color || ((message) => message)
  // exclude msg from template string so values such as error objects
  // can be well formatted
  console.log(color(`uppy: ${time} [${level}] ${tag || ''}`), color(msg))
}
