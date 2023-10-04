import type { Response as ServerResponse } from 'express'

/**
 * ProviderApiError is error returned when an adapter encounters
 * an http error while communication with its corresponding provider
 */
export class ProviderApiError extends Error {
  public statusCode: number

  public isAuthError: boolean

  /**
   * @param {string} message error message
   * @param {number} statusCode the http status code from the provider api
   */
  constructor(message: string, statusCode: number) {
    super(`HTTP ${statusCode}: ${message}`) // Include statusCode to make it easier to debug
    this.name = 'ProviderApiError'
    this.statusCode = statusCode
    this.isAuthError = false
  }
}

/**
 * AuthError is error returned when an adapter encounters
 * an authorization error while communication with its corresponding provider
 */
export class ProviderAuthError extends ProviderApiError {
  constructor() {
    super('invalid access token detected by Provider', 401)
    this.name = 'AuthError'
    this.isAuthError = true
  }
}

type Response = {
  code: number
  message: string
}

/**
 * Convert an error instance to an HTTP response if possible.
 */
export function errorToResponse(
  err: Error | ProviderApiError,
): Response | undefined {
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

  return undefined
}

export function respondWithError(err: Error, res: ServerResponse): boolean {
  const errResp = errorToResponse(err)
  if (errResp) {
    res.status(errResp.code).json({ message: errResp.message })
    return true
  }
  return false
}
