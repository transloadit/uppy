type HttpErrorLike = {
  statusCode: number | undefined
  body: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

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

export class ProviderUserError extends ProviderApiError {
  json: unknown

  constructor(json: unknown) {
    super('User error', undefined)
    this.name = 'ProviderUserError'
    this.json = json
  }
}

export class ProviderAuthError extends ProviderApiError {
  constructor() {
    super('invalid access token detected by Provider', 401)
    this.name = 'AuthError'
    this.isAuthError = true
  }
}

export function parseHttpError(err: unknown): HttpErrorLike | undefined {
  if (!isRecord(err)) return undefined

  if (err.name === 'HTTPError') {
    const response = isRecord(err.response) ? err.response : undefined
    const statusCode =
      response && typeof response.statusCode === 'number'
        ? response.statusCode
        : undefined
    const body = response ? response.body : undefined
    return { statusCode, body }
  }

  if (err.name === 'HttpError') {
    const statusCode =
      typeof err.statusCode === 'number' ? err.statusCode : undefined
    const body = err.responseJson
    return { statusCode, body }
  }

  return undefined
}

function errorToResponse(err: unknown):
  | { code: number; json: Record<string, unknown> }
  | undefined {
  if (!isRecord(err)) return undefined

  if (err.isAuthError === true) {
    return { code: 401, json: { message: `${err.message ?? ''}` } }
  }

  if (err.name === 'ValidationError') {
    return { code: 400, json: { message: `${err.message ?? ''}` } }
  }

  if (err.name === 'ProviderUserError') {
    return { code: 400, json: isRecord(err.json) ? err.json : { data: err.json } }
  }

  if (err.name === 'ProviderApiError') {
    const statusCode =
      typeof err.statusCode === 'number' ? err.statusCode : undefined
    if (statusCode != null && statusCode >= 500) {
      return { code: 502, json: { message: `${err.message ?? ''}` } }
    }
    if (statusCode === 429) {
      return { code: 429, json: { message: `${err.message ?? ''}` } }
    }
    if (statusCode != null && statusCode >= 400) {
      return { code: 424, json: { message: `${err.message ?? ''}` } }
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

export function respondWithError(err: unknown, res: { status: (n: number) => { json: (v: unknown) => void } }): boolean {
  const errResp = errorToResponse(err)
  if (errResp) {
    res.status(errResp.code).json(errResp.json)
    return true
  }
  return false
}

