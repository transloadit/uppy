const logger = require('../logger')
const { ProviderApiError, ProviderAuthError } = require('./error')

async function withProviderErrorHandling ({ fn, tag, providerName, isAuthError = () => false, getJsonErrorMessage }) {
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

    if (response) {
      // @ts-ignore
      if (isAuthError(response)) return new ProviderAuthError()

      return new ProviderApiError(getErrorMessage(response), response.statusCode)
    }

    logger.error(err, tag)

    throw err
  }
}

module.exports = { withProviderErrorHandling }
