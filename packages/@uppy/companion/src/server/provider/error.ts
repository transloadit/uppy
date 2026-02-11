type HttpErrorLike = {
  statusCode: number | undefined
  body: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Error thrown when an adapter encounters an HTTP error while communicating
 * with its corresponding provider.
 */
export class ProviderApiError extends Error {
  statusCode: number | undefined

  isAuthError: boolean

  constructor(message: string, statusCode: number | undefined) {
    super(`HTTP ${statusCode}: ${message}`)
    this.name = 'ProviderApiError'
    this.statusCode = statusCode
    this.isAuthError = false
  }
}

/**
 * Error thrown when the provider response should be forwarded to the client
 * as-is (e.g. user-facing validation errors).
 */
export class ProviderUserError extends ProviderApiError {
  json: unknown

  constructor(json: unknown) {
    super('User error', undefined)
    this.name = 'ProviderUserError'
    this.json = json
  }
}

/**
 * Error thrown when an adapter encounters an authorization error while
 * communicating with its provider. This signals to the client that the access
 * token is invalid and needs to be refreshed or the user needs to re-authenticate.
 */
export class ProviderAuthError extends ProviderApiError {
  constructor() {
    super('invalid access token detected by Provider', 401)
    this.name = 'AuthError'
    this.isAuthError = true
  }
}

export function parseHttpError(err: unknown): HttpErrorLike | undefined {
  if (!isRecord(err)) return undefined

  const name = err['name']
  if (name === 'HTTPError') {
    const responseCandidate = err['response']
    const response = isRecord(responseCandidate) ? responseCandidate : undefined
    const statusCode =
      response && typeof response['statusCode'] === 'number'
        ? response['statusCode']
        : undefined
    const body = response ? response['body'] : undefined
    return { statusCode, body }
  }

  if (name === 'HttpError') {
    const statusCode =
      typeof err['statusCode'] === 'number' ? err['statusCode'] : undefined
    const body = err['responseJson']
    return { statusCode, body }
  }

  return undefined
}

/**
 * Convert an error instance to an HTTP response if possible.
 */
function errorToResponse(
  err: unknown,
): { code: number; json: Record<string, unknown> } | undefined {
  if (!isRecord(err)) return undefined

  if (err['isAuthError'] === true) {
    return { code: 401, json: { message: `${err['message'] ?? ''}` } }
  }

  const name = err['name']

  if (name === 'ValidationError') {
    return { code: 400, json: { message: `${err['message'] ?? ''}` } }
  }

  if (name === 'ProviderUserError') {
    const json = err['json']
    return {
      code: 400,
      json: isRecord(json) ? json : { data: json },
    }
  }

  if (name === 'ProviderApiError') {
    const statusCode =
      typeof err['statusCode'] === 'number' ? err['statusCode'] : undefined
    if (statusCode != null && statusCode >= 500) {
      return { code: 502, json: { message: `${err['message'] ?? ''}` } }
    }
    if (statusCode === 429) {
      return { code: 429, json: { message: `${err['message'] ?? ''}` } }
    }
    if (statusCode != null && statusCode >= 400) {
      return { code: 424, json: { message: `${err['message'] ?? ''}` } }
    }
  }

  const httpError = parseHttpError(err)
  if (httpError) {
    return {
      code: 500,
      json: { statusCode: httpError.statusCode, body: httpError.body },
    }
  }

  return undefined
}

export function respondWithError(
  err: unknown,
  res: { status: (n: number) => { json: (v: unknown) => void } },
): boolean {
  const errResp = errorToResponse(err)
  if (errResp) {
    res.status(errResp.code).json(errResp.json)
    return true
  }
  return false
}
