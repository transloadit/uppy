const logger = require('../logger')
const { ProviderApiError, ProviderUserError, ProviderAuthError, parseHttpError } = require('./error')

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
    const httpError = parseHttpError(err)

    // Wrap all HTTP errors according to the provider's desired error handling
    if (httpError) {
      const { statusCode, body } = httpError
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

    // non HTTP errors will be passed through
    logger.error(err, tag)
    throw err
  }
}

async function withGoogleErrorHandling (providerName, tag, fn) {
  return withProviderErrorHandling({
    fn,
    tag,
    providerName,
    isAuthError: (response) => (
      response.statusCode === 401
      || (response.statusCode === 400 && response.body?.error === 'invalid_grant') // Refresh token has expired or been revoked
    ),
    getJsonErrorMessage: (body) => body?.error?.message,
  })
}

module.exports = { withProviderErrorHandling, withGoogleErrorHandling, parseHttpError }
