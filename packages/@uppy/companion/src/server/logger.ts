import { inspect, styleText } from 'node:util'
import escapeStringRegexp from 'escape-string-regexp'

type Colors = Parameters<typeof styleText>[0]
type LogLevel = 'error' | 'info' | 'warn' | 'debug'

/**
 * Longest log line we will write. An error that quotes attacker-controlled
 * data (e.g. a WebDAV XML parse error naming a multi-megabyte entity) could
 * otherwise write unbounded output to the log.
 */
export const MAX_LOG_MESSAGE_LENGTH = 10_000

/**
 * Render an Error as stack (or name+message) plus a few safe own fields and
 * its cause chain. Never util.inspect the whole object: got's errors carry the
 * request options, which hold the Authorization header and uploadHeaders.
 */
function formatError(err: Error, depth = 0): string {
  let out = err.stack ?? `${err.name}: ${err.message}`
  const code = (err as { code?: unknown }).code
  if (typeof code === 'string') out += ` {code: ${code}}`
  const statusCode = (err as { statusCode?: unknown }).statusCode
  if (typeof statusCode === 'number') out += ` {statusCode: ${statusCode}}`
  const { cause } = err
  if (cause != null && depth < 5) {
    out +=
      cause instanceof Error
        ? `\n  [cause]: ${formatError(cause, depth + 1)}`
        : `\n  [cause]: ${inspect(cause, { depth: 1 })}`
  }
  return out
}

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
    if (arg instanceof Error) return formatError(arg)
    return inspect(arg)
  }

  const msgString = msgToString()
  const maskedFull = maskMessage(msgString)
  const masked =
    maskedFull.length > MAX_LOG_MESSAGE_LENGTH
      ? `${maskedFull.slice(0, MAX_LOG_MESSAGE_LENGTH)}… [truncated ${
          maskedFull.length - MAX_LOG_MESSAGE_LENGTH
        } chars]`
      : maskedFull
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
    ...(tag != null && { tag }),
    ...(traceId != null && { traceId }),
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
    ...(tag != null && { tag }),
    ...(traceId != null && { traceId }),
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
    ...(tag != null && { tag }),
    ...(traceId != null && { traceId }),
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
      ...(tag != null && { tag }),
      ...(traceId != null && { traceId }),
    })
  }
}

const logger = { setMaskables, setProcessName, info, warn, error, debug }
export default logger
