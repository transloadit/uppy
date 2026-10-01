/**
 * Check whether a thrown value can be used as an `Error`: either an actual
 * `Error`, or any object with a string `message` (e.g. a polyfilled
 * `DOMException`, or a plain object thrown by user code).
 *
 * @param err The thrown value.
 * @returns Whether `err` is error-like.
 */
export function isErrorLike(err: unknown): err is Error {
  return (
    err instanceof Error ||
    (typeof err === 'object' &&
      err != null &&
      'message' in err &&
      typeof err.message === 'string')
  )
}

/**
 * Convert a thrown value to an `Error`. Error-like values are returned as-is,
 * to preserve their identity and any extra properties.
 *
 * @param err The thrown value.
 * @returns `err` if it's error-like, otherwise a new `Error` describing it.
 */
export default function toError(err: unknown): Error {
  return isErrorLike(err) ? err : new Error(String(err))
}
