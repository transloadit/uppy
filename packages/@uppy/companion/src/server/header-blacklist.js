const isObject = require('isobject')
const logger = require('./logger')

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
  'via'
]

/**
 * Forbidden header regexs.
 */
const forbiddenRegex = [/^proxy-.*$/, /^sec-.*$/]

/**
 * Check if the header in parameter is a forbidden header.
 * @param {string} header Header to check
 * @return True if header is forbidden, false otherwise.
 */
const isForbiddenHeader = (header) => {
  const headerLower = header.toLowerCase()
  const forbidden =
    forbiddenNames.indexOf(headerLower) >= 0 ||
    forbiddenRegex.findIndex((regex) => regex.test(headerLower)) >= 0

  if (forbidden) {
    logger.warn(`Header forbidden: ${header}`, 'header.forbidden')
  }
  return forbidden
}

module.exports = (headers) => {
  if (!isObject(headers)) {
    return {}
  }

  const headersCloned = Object.assign({}, headers)
  Object.keys(headersCloned).forEach((header) => {
    if (isForbiddenHeader(header)) {
      delete headersCloned[header]
    }
  })
  return headersCloned
}
