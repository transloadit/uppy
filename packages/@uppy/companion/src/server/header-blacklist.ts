import * as logger from './logger.js'

/**
 * Forbidden header names.
 */
const forbiddenNames = [
  'accept-charset',
  'accept-encoding',
  'access-control-request-headers',
  'access-control-request-method',
  'connection',
  'content-length',
  'cookie',
  'cookie2',
  'date',
  'dnt',
  'expect',
  'host',
  'keep-alive',
  'origin',
  'referer',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'via',
]

/**
 * Forbidden header regexs.
 */
const forbiddenRegex = [/^proxy-.*$/, /^sec-.*$/]

/**
 * Check if the header in parameter is a forbidden header.
 *
 * @param {string} header Header to check
 * @returns True if header is forbidden, false otherwise.
 */
const isForbiddenHeader = (header: string): boolean => {
  const headerLower = header.toLowerCase()
  const forbidden =
    forbiddenNames.indexOf(headerLower) >= 0 ||
    forbiddenRegex.findIndex((regex) => regex.test(headerLower)) >= 0

  if (forbidden) {
    logger.warn(`Header forbidden: ${header}`, 'header.forbidden')
  }
  return forbidden
}

export default function headerBlacklist(
  headers: unknown,
): Record<string, string> {
  if (
    headers == null ||
    typeof headers !== 'object' ||
    Array.isArray(headers)
  ) {
    return {}
  }

  const out: Record<string, string> = {}
  for (const [header, value] of Object.entries(headers)) {
    if (isForbiddenHeader(header)) continue
    if (typeof value !== 'string') continue
    out[header] = value
  }
  return out
}
