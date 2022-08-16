const logger = require('../logger')
const { ProviderApiError, ProviderAuthError } = require('./error')

function convertProviderError ({ err, providerName, isAuthError = () => false, getJsonErrorMessage }) {
  const { response } = err

  function getErrorMessage () {
    if (typeof response.body === 'object') {
      const message = getJsonErrorMessage(response.body)
      if (message != null) return message
    }

    if (typeof response.body === 'string') {
      return response.body
    }

    return `request to ${providerName} returned ${response.statusCode}`
  }

  if (response) {
    // @ts-ignore
    if (isAuthError(response)) return new ProviderAuthError()

    return new ProviderApiError(getErrorMessage(), response.statusCode)
  }

  return err
}

async function withProviderErrorHandling ({ fn, tag, providerName, isAuthError, getJsonErrorMessage }) {
  try {
    return await fn()
  } catch (err) {
    const err2 = convertProviderError({ err, providerName, isAuthError, getJsonErrorMessage })
    logger.error(err2, tag)
    throw err2
  }
}

module.exports = { withProviderErrorHandling }
