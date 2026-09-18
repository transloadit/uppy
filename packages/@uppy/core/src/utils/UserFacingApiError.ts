/**
 * A failure to show the user as is. Companion reports these as a 400 with
 * either a `code` (see `companion-client/errorCodes.ts` for the ones this
 * version knows and their locale strings) or a verbatim `message` (text
 * forwarded from a provider's own API); a plugin may throw one with an
 * already translated `message` for the same effect.
 */
class UserFacingApiError extends Error {
  name = 'UserFacingApiError'

  /**
   * Companion's error code, a `CompanionErrorCode` when this version knows it
   * (a newer Companion may send one it does not).
   */
  code: string | undefined

  constructor(message: string, code?: string) {
    super(message)
    this.code = code
  }
}

export default UserFacingApiError
