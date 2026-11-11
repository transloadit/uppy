import type { RestrictionError } from '../Restricter.js'

/**
 * Check whether a thrown value is a {@link RestrictionError}. This checks its
 * `isRestriction` property, as `instanceof RestrictionError` is unsafe across
 * multiple copies of `@uppy/core`.
 *
 * @param err The thrown value.
 * @returns Whether `err` is a restriction error.
 */
export default function isRestrictionError(
  err: unknown,
): err is RestrictionError<any, any> {
  return (
    err instanceof Error && 'isRestriction' in err && err.isRestriction === true
  )
}
