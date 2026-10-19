import { isErrorLike } from './toError.js'

/**
 * Get the message of a thrown value.
 *
 * @param err The thrown value.
 * @returns The `message` of an error-like value, otherwise `err` as a string.
 */
export default function getErrorMessage(err: unknown): string {
  return isErrorLike(err) ? err.message : String(err)
}
