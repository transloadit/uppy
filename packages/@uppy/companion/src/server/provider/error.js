/**
 * ProviderApiError is error returned when an adapter encounters
 * an http error while communication with its corresponding provider
 */
class ProviderApiError extends Error {
  /**
   * @param {string} message error message
   * @param {number} statusCode the http status code from the provider api
   */
  constructor (message, statusCode) {
    super(message)
    this.name = 'ProviderApiError'
    this.statusCode = statusCode
    this.isAuthError = false
  }
}

/**
 * AuthError is error returned when an adapter encounters
 * an authorization error while communication with its corresponding provider
 */
class ProviderAuthError extends ProviderApiError {
  constructor () {
    super('invalid access token detected by Provider', 401)
    this.name = 'AuthError'
    this.isAuthError = true
  }
}

/**
 * Convert an error instance to an http response if possible
 * @param {Error | ProviderApiError} err the error instance to convert to an http json response
 */
function errorToResponse (err) {
  if (err instanceof ProviderAuthError && err.isAuthError) {
    return { code: 401, message: err.message }
  }

  if (err instanceof ProviderApiError) {
    if (err.statusCode >= 500) {
      // bad gateway i.e the provider APIs gateway
      return { code: 502, message: err.message }
    }

    if (err.statusCode >= 400) {
      // 424 Failed Dependency
      return { code: 424, message: err.message }
    }
  }
}

module.exports = { ProviderAuthError, ProviderApiError, errorToResponse }
