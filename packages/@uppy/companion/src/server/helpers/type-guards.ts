export function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

/** `value` if it is a non-null, non-array object, otherwise `{}`. */
export function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {}
}

export function toError(err: unknown): Error {
  if (err instanceof Error) return err
  if (typeof err === 'string') return new Error(err)
  return new Error('Unknown error')
}
