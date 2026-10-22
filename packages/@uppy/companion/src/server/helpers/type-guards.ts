export function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Express 5 sets `req.body` to `undefined` when nothing was parsed
 * (no body, or a non-matching content type), so normalize it to a record.
 */
export function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {}
}

export function toError(err: unknown): Error {
  if (err instanceof Error) return err
  if (typeof err === 'string') return new Error(err)
  return new Error('Unknown error')
}
