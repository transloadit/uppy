/**
 * INFO level log
 * @param {string} msg the message to log
 * @param {string} tag a unique tag to easily search for this message
 */
exports.info = (msg, tag) => {
  log(msg, tag, 'info')
}

/**
 * WARN level log
 * @param {string} msg the message to log
 * @param {string} tag a unique tag to easily search for this message
 */
exports.warn = (msg, tag) => {
  log(msg, tag, 'warn')
}

/**
 * ERROR level log
 * @param {string | Error} msg the message to log
 * @param {string} tag a unique tag to easily search for this message
 */
exports.error = (msg, tag) => {
  log(msg, tag, 'error')
}

/**
 * DEBUG level log
 * @param {string} msg the message to log
 * @param {string} tag a unique tag to easily search for this message
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
 */
const log = (msg, tag, level) => {
  // @TODO add some colors based on log level
  const time = new Date().toISOString()
  console.log(`uppy: ${time} [${level}] ${tag} ${msg}`)
}
