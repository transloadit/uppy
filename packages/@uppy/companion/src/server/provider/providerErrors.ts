import { isRecord } from '../helpers/type-guards.js'
import * as logger from '../logger.js'
import {
  ProviderApiError,
  ProviderAuthError,
  ProviderUserError,
  parseHttpError,
} from './error.js'

export { parseHttpError }

type ProviderHttpError = {
  statusCode: number | undefined
  body: unknown
}

/** `getJsonErrorMessage` for providers whose error body has a string at `path`. */
export const jsonStringAt =
  (...path: string[]) =>
  (body: unknown): string | undefined => {
    let value = body
    for (const key of path) {
      if (!isRecord(value)) return undefined
      value = value[key]
    }
    return typeof value === 'string' ? value : undefined
  }

/** `isAuthError` for providers that answer an expired token with HTTP 401. */
export const isUnauthorized = ({ statusCode }: ProviderHttpError): boolean =>
  statusCode === 401

type ProviderErrorHandlingOptions<T> = {
  fn: () => Promise<T>
  tag: string
  providerName: string
  isAuthError?: (a: ProviderHttpError) => boolean
  isUserFacingError?: (a: ProviderHttpError) => boolean
  getJsonErrorMessage: (a: unknown) => string | undefined
}

/**
 * Wrap a provider call and normalize errors to Provider*Error instances.
 */
export async function withProviderErrorHandling<T>({
  fn,
  tag,
  providerName,
  isAuthError = (_: ProviderHttpError) => false,
  isUserFacingError = (_: ProviderHttpError) => false,
  getJsonErrorMessage,
}: ProviderErrorHandlingOptions<T>): Promise<T> {
  function getErrorMessage({ statusCode, body }: ProviderHttpError): string {
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
      let knownErr: Error
      if (isAuthError({ statusCode, body })) {
        knownErr = new ProviderAuthError()
      } else if (isUserFacingError({ statusCode, body })) {
        knownErr = new ProviderUserError({
          message: getErrorMessage({ statusCode, body }),
        })
      } else {
        knownErr = new ProviderApiError(
          getErrorMessage({ statusCode, body }),
          statusCode,
        )
      }

      logger.error(knownErr, tag)
      throw knownErr
    }

    // non HTTP errors will be passed through
    logger.error(err, tag)
    throw err
  }
}

export async function withGoogleErrorHandling<T>(
  providerName: string,
  tag: string,
  fn: () => Promise<T>,
): Promise<T> {
  return withProviderErrorHandling<T>({
    fn,
    tag,
    providerName,
    isAuthError: (response) =>
      isUnauthorized(response) ||
      (response.statusCode === 400 &&
        isRecord(response.body) &&
        response.body['error'] === 'invalid_grant'), // Refresh token has expired or been revoked
    getJsonErrorMessage: jsonStringAt('error', 'message'),
  })
}
