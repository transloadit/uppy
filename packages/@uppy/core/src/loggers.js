const getTimeStamp = require('@uppy/utils/lib/getTimeStamp')

// Swallow all logs, except errors.
// default if logger is not set or debug: false
const justErrorsLogger = {
  debug: (...args) => {},
  warn: (...args) => {},
  error: (...args) => console.error(`[Uppy] [${getTimeStamp()}]`, ...args)
}

// Print logs to console with namespace + timestamp,
// set by logger: Uppy.debugLogger or debug: true
const debugLogger = {
  debug: (...args) => {
    // IE 10 doesn’t support console.debug
    const debug = console.debug || console.log
    debug.call(console, `[Uppy] [${getTimeStamp()}]`, ...args)
  },
  warn: (...args) => console.warn(`[Uppy] [${getTimeStamp()}]`, ...args),
  error: (...args) => console.error(`[Uppy] [${getTimeStamp()}]`, ...args)
}

module.exports = {
  justErrorsLogger,
  debugLogger
}
