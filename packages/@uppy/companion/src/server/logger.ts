import util from 'node:util'
import escapeStringRegexp from 'escape-string-regexp'
import supportsColors from 'supports-color'

let valuesToMask = []
/**
 * Adds a list of strings that should be masked by the logger.
 * This function can only be called once through out the life of the server.
 *
 * @param {Array} maskables a list of strings to be masked
 */
export function setMaskables(maskables) {
  valuesToMask = maskables.map((i) => escapeStringRegexp(i))
}

/**
 * Mask the secret content of a message
 *
 * @param {string} msg the message whose content should be masked
 * @returns {string}
 */
function maskMessage(msg) {
  let out = msg
  for (const toBeMasked of valuesToMask) {
    const toBeReplaced = new RegExp(toBeMasked, 'gi')
    out = out.replace(toBeReplaced, '******')
  }
  return out
}

let processName = 'companion'

export function setProcessName(newProcessName) {
  processName = newProcessName
}

const styleText =
  typeof util.styleText === 'function' && supportsColors.stderr
    ? util.styleText
    : (style, text) => text

/**
 * message log
 *
 * @typedef {import('node:util').styleText} styleText
 * @typedef {Parameters<styleText>[0]} Colors
 *
 * @param {object} params
 * @param {string | Error} params.arg the message or error to log
 * @param {string} params.tag a unique tag to easily search for this message
 * @param {string} params.level error | info | debug
 * @param {string} [params.traceId] a unique id to easily trace logs tied to a request
 * @param {Colors} [params.color] Format(s) that can be passed to `util.styleText`.
 */
const log = ({ arg, tag = '', level, traceId = '', color = [] }) => {
  const time = new Date().toISOString()
  const whitespace = tag && traceId ? ' ' : ''

  function msgToString() {
    // We don't need to log stack trace on special errors that we ourselves have produced
    // (to reduce log noise)
    // @ts-ignore
    if (
      arg instanceof Error &&
      arg.name === 'ProviderApiError' &&
      typeof arg.message === 'string'
    ) {
      return arg.message
    }
    if (typeof arg === 'string') return arg
    return util.inspect(arg)
  }

  const msgString = msgToString()
  const masked = maskMessage(msgString)
  console.log(
    styleText(
      color,
      `${processName}: ${time} [${level}] ${traceId}${whitespace}${tag}`,
    ),
    styleText(color, masked),
  )
}

/**
 * INFO level log
 *
 * @param {string} msg the message to log
 * @param {string} [tag] a unique tag to easily search for this message
 * @param {string} [traceId] a unique id to easily trace logs tied to a request
 */
export function info(msg, tag, traceId) {
  log({ arg: msg, tag, level: 'info', traceId })
}

/**
 * WARN level log
 *
 * @param {string} msg the message to log
 * @param {string} [tag] a unique tag to easily search for this message
 * @param {string} [traceId] a unique id to easily trace logs tied to a request
 */
export function warn(msg, tag, traceId) {
  log({ arg: msg, tag, level: 'warn', traceId, color: ['bold', 'yellow'] })
}

/**
 * ERROR level log
 *
 * @param {string | Error} msg the message to log
 * @param {string} [tag] a unique tag to easily search for this message
 * @param {string} [traceId] a unique id to easily trace logs tied to a request
 */
export function error(msg, tag, traceId) {
  log({ arg: msg, tag, level: 'error', traceId, color: ['bold', 'red'] })
}

/**
 * DEBUG level log
 *
 * @param {string} msg the message to log
 * @param {string} [tag] a unique tag to easily search for this message
 * @param {string} [traceId] a unique id to easily trace logs tied to a request
 */
export function debug(msg, tag, traceId) {
  if (process.env.NODE_ENV !== 'production') {
    log({ arg: msg, tag, level: 'debug', traceId, color: ['bold', 'blue'] })
  }
}

const logger = { setMaskables, setProcessName, info, warn, error, debug }
export default logger
