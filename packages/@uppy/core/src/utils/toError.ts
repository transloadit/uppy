// Anything with a string `message` (e.g. a polyfilled DOMException, or a plain
// object thrown by user code) is passed through as-is, to preserve its identity
// and any extra properties.
function isErrorLike(err: unknown): err is Error {
  return (
    err instanceof Error ||
    (typeof err === 'object' &&
      err != null &&
      'message' in err &&
      typeof err.message === 'string')
  )
}

export default function toError(err: unknown): Error {
  return isErrorLike(err) ? err : new Error(String(err))
}
