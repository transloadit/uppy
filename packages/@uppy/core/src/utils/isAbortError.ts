/**
 * Check whether a thrown value is an abort error. This only checks the `name`,
 * as abort errors are `DOMException`s, which may not extend `Error`.
 *
 * @param err The thrown value.
 * @returns Whether `err` is an abort error.
 */
export default function isAbortError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err != null &&
    'name' in err &&
    err.name === 'AbortError'
  )
}
