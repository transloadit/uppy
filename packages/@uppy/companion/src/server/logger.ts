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

export function setMaskables(maskables: readonly string[]): void {
  valuesToMask = maskables.map((i) => escapeStringRegexp(i))
}

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

export function info(msg: string, tag?: string, traceId?: string): void {
  log({ arg: msg, tag, level: 'info', traceId })
}

export function warn(msg: string, tag?: string, traceId?: string): void {
  log({ arg: msg, tag, level: 'warn', traceId, color: ['bold', 'yellow'] })
}

export function error(msg: string | Error, tag?: string, traceId?: string): void {
  log({ arg: msg, tag, level: 'error', traceId, color: ['bold', 'red'] })
}

export function debug(msg: string, tag?: string, traceId?: string): void {
  if (process.env.NODE_ENV !== 'production') {
    log({ arg: msg, tag, level: 'debug', traceId, color: ['bold', 'blue'] })
  }
}

const logger = { setMaskables, setProcessName, info, warn, error, debug }
export default logger
