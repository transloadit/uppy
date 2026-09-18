/**
 * A failure to show the user as is. Companion reports these as a 400 with
 * either a `code` (also a `@uppy/core` locale key, translated here) or a
 * verbatim `message` (text forwarded from a provider's own API); a plugin may
 * throw one with an already translated `message` for the same effect.
 */
class UserFacingApiError extends Error {
  name = 'UserFacingApiError'

  /** Companion's error code, also the locale key to show instead of `message`. */
  code: string | undefined

  constructor(message: string, code?: string) {
    super(message)
    this.code = code
  }
}

export default UserFacingApiError
