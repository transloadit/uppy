const logger = require('../logger')
const { ProviderApiError, ProviderUserError, ProviderAuthError } = require('./error')

async function withProviderErrorHandling ({
  // eslint-disable-next-line no-unused-vars
  fn, tag, providerName, isAuthError = () => false, isUserFacingError = (response) => false, getJsonErrorMessage,
}) {
  function getErrorMessage (response) {
    if (typeof response.body === 'object') {
      const message = getJsonErrorMessage(response.body)
      if (message != null) return message
    }

    if (typeof response.body === 'string') {
      return response.body
    }

    return `request to ${providerName} returned ${response.statusCode}`
  }

  try {
    return await fn()
  } catch (err) {
    const { response } = err

    let err2 = err

    if (response) {
      // @ts-ignore
      if (isAuthError(response)) err2 = new ProviderAuthError()
      if (isUserFacingError(response)) err2 = new ProviderUserError({ message: getErrorMessage(response) })
      else err2 = new ProviderApiError(getErrorMessage(response), response.statusCode)
    }

    logger.error(err2, tag)

    throw err2
  }
}

module.exports = { withProviderErrorHandling }
