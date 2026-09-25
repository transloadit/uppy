import type { RestrictionError } from '../Restricter.js'

// checks the property, as `instanceof RestrictionError` is unsafe across multiple copies of @uppy/core
export default function isRestrictionError(
  err: unknown,
): err is RestrictionError<any, any> {
  return (
    err instanceof Error && 'isRestriction' in err && err.isRestriction === true
  )
}
