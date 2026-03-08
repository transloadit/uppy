export function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

export function toError(err: unknown): Error {
  if (err instanceof Error) return err
  if (typeof err === 'string') return new Error(err)
  return new Error('Unknown error')
}

export const isEncryptionSecret = (value: unknown): value is string | Buffer =>
  (typeof value === 'string' && value.length > 0) || Buffer.isBuffer(value)
