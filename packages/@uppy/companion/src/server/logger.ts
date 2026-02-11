import util from 'node:util'
import escapeStringRegexp from 'escape-string-regexp'
import supportsColors from 'supports-color'

type StyleTextFn = (
  style: Parameters<NonNullable<typeof util.styleText>>[0],
  text: string,
) => string
type Colors = Parameters<StyleTextFn>[0]
type LogLevel = 'error' | 'info' | 'warn' | 'debug'

let valuesToMask: string[] = []

/**
 * Adds a list of strings that should be masked by the logger.
 * This is expected to be set during startup and not updated continuously.
 */
export function setMaskables(maskables: readonly string[]): void {
  valuesToMask = maskables.map((i) => escapeStringRegexp(i))
}

/**
 * Mask secret values in a log message.
 */
function maskMessage(msg: string): string {
  let out = msg
  for (const toBeMasked of valuesToMask) {
    const toBeReplaced = new RegExp(toBeMasked, 'gi')
    out = out.replace(toBeReplaced, '******')
  }
  return out
}

let processName = 'companion'

export function setProcessName(newProcessName: string): void {
  processName = newProcessName
}

const styleText: StyleTextFn =
  typeof util.styleText === 'function' && supportsColors.stderr
    ? (style, text) => util.styleText!(style, text)
    : (_style, text) => text

/**
 * Logs a message.
 *
 * @param params.arg - The message or error to log.
 * @param params.tag - A tag to easily search for this message.
 * @param params.level - Log level.
 * @param params.traceId - A unique id to correlate logs tied to a request.
 * @param params.color - Format(s) that can be passed to `util.styleText`.
 */
function log(params: {
  arg: unknown
  tag?: string
  level: LogLevel
  traceId?: string
  color?: Colors
}): void {
  const { arg, level } = params
  const tag = params.tag ?? ''
  const traceId = params.traceId ?? ''
  const color = params.color ?? []

  const time = new Date().toISOString()
  const whitespace = tag && traceId ? ' ' : ''

  function msgToString(): string {
    // We don't need to log stack trace on special errors that we ourselves have produced
    // (to reduce log noise).
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
 * INFO level log.
 */
export function info(msg: unknown, tag?: string, traceId?: string): void {
  log({
    arg: msg,
    level: 'info',
    ...(tag === undefined ? {} : { tag }),
    ...(traceId === undefined ? {} : { traceId }),
  })
}

/**
 * WARN level log.
 */
export function warn(msg: unknown, tag?: string, traceId?: string): void {
  log({
    arg: msg,
    level: 'warn',
    color: ['bold', 'yellow'],
    ...(tag === undefined ? {} : { tag }),
    ...(traceId === undefined ? {} : { traceId }),
  })
}

/**
 * ERROR level log.
 */
export function error(msg: unknown, tag?: string, traceId?: string): void {
  log({
    arg: msg,
    level: 'error',
    color: ['bold', 'red'],
    ...(tag === undefined ? {} : { tag }),
    ...(traceId === undefined ? {} : { traceId }),
  })
}

/**
 * DEBUG level log.
 */
export function debug(msg: unknown, tag?: string, traceId?: string): void {
  if (process.env['NODE_ENV'] !== 'production') {
    log({
      arg: msg,
      level: 'debug',
      color: ['bold', 'blue'],
      ...(tag === undefined ? {} : { tag }),
      ...(traceId === undefined ? {} : { traceId }),
    })
  }
}

const logger = { setMaskables, setProcessName, info, warn, error, debug }
export default logger
