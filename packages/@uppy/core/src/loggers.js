const getTimeStamp = require('@uppy/utils/lib/getTimeStamp')

// Swallow logs, default if logger is not set or debug: false
const nullLogger = {
  debug: (...args) => {},
  warn: (...args) => {},
  error: (...args) => {}
}

// Print logs to console with namespace + timestamp,
// default if logger: 'debug' or debug: true
const debugLogger = {
  debug: (...args) => console.debug(`[Uppy] [${getTimeStamp()}]`, ...args),
  warn: (...args) => console.warn(`[Uppy] [${getTimeStamp()}]`, ...args),
  error: (...args) => console.error(`[Uppy] [${getTimeStamp()}]`, ...args)
}

module.exports = {
  nullLogger,
  debugLogger
}
