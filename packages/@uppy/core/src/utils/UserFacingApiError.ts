import type { CompanionErrorCode } from '../companion-client/errorCodes.js'

/**
 * A failure to show the user as is. Companion reports these as a 400 with
 * either a `code` (see `companion-client/errorCodes.ts` for the ones this
 * version knows and their locale strings) or a verbatim `message` (text
 * forwarded from a provider's own API); a plugin may throw one with an
 * already translated `message` for the same effect.
 */
/**
 * A known code, or any other string: a newer Companion may send one this
 * version does not know. (`string & {}` keeps the known ones in completion.)
 */
type ErrorCode = CompanionErrorCode | (string & {})

class UserFacingApiError extends Error {
  name = 'UserFacingApiError'

  /** Companion's error code; see `companion-client/errorCodes.ts`. */
  code: ErrorCode | undefined

  constructor(message: string, code?: ErrorCode) {
    super(message)
    this.code = code
  }
}

export default UserFacingApiError
