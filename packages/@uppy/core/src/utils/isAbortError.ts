// duck-typed, as an abort error is a DOMException, which may not extend Error
export default function isAbortError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err != null &&
    'name' in err &&
    err.name === 'AbortError'
  )
}
