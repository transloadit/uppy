import getTimeStamp from '@uppy/utils/lib/getTimeStamp'

// Swallow all logs, except errors.
// default if logger is not set or debug: false
const justErrorsLogger = {
  debug: (): void => {},
  warn: (): void => {},
  error: (...args: any[]): void =>
    console.error(`[Uppy] [${getTimeStamp()}]`, ...args),
}

// Print logs to console with namespace + timestamp,
// set by logger: Uppy.debugLogger or debug: true
const debugLogger = {
  debug: (...args: any[]): void =>
    console.debug(`[Uppy] [${getTimeStamp()}]`, ...args),
  warn: (...args: any[]): void =>
    console.warn(`[Uppy] [${getTimeStamp()}]`, ...args),
  error: (...args: any[]): void =>
    console.error(`[Uppy] [${getTimeStamp()}]`, ...args),
}

export { justErrorsLogger, debugLogger }
