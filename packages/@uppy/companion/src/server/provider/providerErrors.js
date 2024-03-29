const logger = require('../logger')
const { ProviderApiError, ProviderUserError, ProviderAuthError } = require('./error')

/**
 * 
 * @param {{
 *   fn: () => any,
 *   tag: string,
 * providerName: string,
 *   isAuthError?: (a: { statusCode: number, body?: object }) => boolean,
 * isUserFacingError?: (a: { statusCode: number, body?: object }) => boolean,
 *   getJsonErrorMessage: (a: object) => string
 * }} param0 
 * @returns 
 */
async function withProviderErrorHandling({
  fn,
  tag,
  providerName,
  isAuthError = () => false,
  isUserFacingError = () => false,
  getJsonErrorMessage,
}) {
  function getErrorMessage({ statusCode, body }) {
    if (typeof body === 'object') {
      const message = getJsonErrorMessage(body)
      if (message != null) return message
    }

    if (typeof body === 'string') {
      return body
    }

    return `request to ${providerName} returned ${statusCode}`
  }

  try {
    return await fn()
  } catch (err) {
    let statusCode
    let body

    if (err?.name === 'HTTPError') {
      statusCode = err.response?.statusCode
      body = err.response?.body
    } else if (err?.name === 'StreamHttpJsonError') {
      statusCode = err.statusCode
      body = err.responseJson
    }

    if (statusCode != null) {
      let knownErr
      if (isAuthError({ statusCode, body })) {
        knownErr = new ProviderAuthError()
      } else if (isUserFacingError({ statusCode, body })) {
        knownErr = new ProviderUserError({ message: getErrorMessage({ statusCode, body }) })
      } else {
        knownErr = new ProviderApiError(getErrorMessage({ statusCode, body }), statusCode)
      }

      logger.error(knownErr, tag)
      throw knownErr
    }

    logger.error(err, tag)

    throw err
  }
}

module.exports = { withProviderErrorHandling }
