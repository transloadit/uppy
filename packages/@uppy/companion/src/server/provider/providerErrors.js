const { HTTPError } = require('got').default

const logger = require('../logger')
const { ProviderApiError, ProviderAuthError } = require('./error')
const { StreamHttpJsonError } = require('../helpers/utils')

/**
 * 
 * @param {{
 *   fn: () => any, tag: string, providerName: string, isAuthError: (a: { statusCode: number, body?: object }) => boolean,
 *   getJsonErrorMessage: (a: object) => string
 * }} param0 
 * @returns 
 */
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
    let statusCode
    let body

    if (err instanceof HTTPError) {
      statusCode = err.response?.statusCode
      body = err.response?.body
    } else if (err instanceof StreamHttpJsonError) {
      statusCode = err.statusCode      
      body = err.responseJson
    }

    if (statusCode != null) {
      const err2 = isAuthError({ statusCode, body })
        ? new ProviderAuthError()
        : new ProviderApiError(getErrorMessage(body), statusCode)

      logger.error(err2, tag)
      throw err2
    }

    logger.error(err, tag)

    throw err
  }
}

module.exports = { withProviderErrorHandling }
