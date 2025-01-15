/* eslint-disable max-classes-per-file */
/**
 * ProviderApiError is error returned when an adapter encounters
 * an http error while communication with its corresponding provider
 */
class ProviderApiError extends Error {
  /**
   * @param {string} message error message
   * @param {number} statusCode the http status code from the provider api
   */
  constructor(message, statusCode) {
    super(`HTTP ${statusCode}: ${message}`) // Include statusCode to make it easier to debug
    this.name = 'ProviderApiError'
    this.statusCode = statusCode
    this.isAuthError = false
  }
}

class ProviderUserError extends ProviderApiError {
  /**
   * @param {object} json arbitrary JSON.stringify-able object that will be passed to the client
   */
  constructor(json) {
    super('User error', undefined)
    this.name = 'ProviderUserError'
    this.json = json
  }
}

/**
 * AuthError is error returned when an adapter encounters
 * an authorization error while communication with its corresponding provider
 * this signals to the client that the access token is invalid and needs to be
 * refreshed or the user needs to re-authenticate
 */
class ProviderAuthError extends ProviderApiError {
  constructor() {
    super('invalid access token detected by Provider', 401)
    this.name = 'AuthError'
    this.isAuthError = true
  }
}

function parseHttpError(err) {
  if (err?.name === 'HTTPError') {
    return {
      statusCode: err.response?.statusCode,
      body: err.response?.body,
    }
  }
  if (err?.name === 'HttpError') {
    return {
      statusCode: err.statusCode,
      body: err.responseJson,
    }
  }
  return undefined
}

/**
 * Convert an error instance to an http response if possible
 *
 * @param {Error | ProviderApiError} err the error instance to convert to an http json response
 * @returns {object | undefined} an object with a code and json field if the error can be converted to a response
 */
function errorToResponse(err) {
  // @ts-ignore
  if (err?.isAuthError) {
    return { code: 401, json: { message: err.message } }
  }

  if (err?.name === 'ValidationError') {
    return { code: 400, json: { message: err.message } }
  }

  if (err?.name === 'ProviderUserError') {
    // @ts-ignore
    return { code: 400, json: err.json }
  }

  if (err?.name === 'ProviderApiError') {
    // @ts-ignore
    if (err.statusCode >= 500) {
      // bad gateway i.e the provider APIs gateway
      return { code: 502, json: { message: err.message } }
    }

    // @ts-ignore
    if (err.statusCode === 429) {
      return { code: 429, message: err.message }
    }

    // @ts-ignore
    if (err.statusCode >= 400) {
      // 424 Failed Dependency
      return { code: 424, json: { message: err.message } }
    }
  }

  const httpError = parseHttpError(err)
  if (httpError) {
    // We proxy the response purely for ease of debugging
    return { code: 500, json: { statusCode: httpError.statusCode, body: httpError.body } }
  }

  return undefined
}

function respondWithError(err, res) {
  const errResp = errorToResponse(err)
  if (errResp) {
    res.status(errResp.code).json(errResp.json)
    return true
  }
  return false
}

module.exports = { ProviderAuthError, ProviderApiError, ProviderUserError, respondWithError, parseHttpError }
