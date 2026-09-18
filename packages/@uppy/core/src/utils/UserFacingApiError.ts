/**
 * A failure to show the user as is. Companion reports these as a 400 with
 * either an `i18nKey` (a `@uppy/core` locale key, translated here) or a
 * verbatim `message` (text forwarded from a provider's own API); a plugin may
 * throw one with an already translated `message` for the same effect.
 */
class UserFacingApiError extends Error {
  name = 'UserFacingApiError'

  /** Locale key to translate instead of showing `message` verbatim. */
  i18nKey: string | undefined

  constructor(message: string, i18nKey?: string) {
    super(message)
    this.i18nKey = i18nKey
  }
}

export default UserFacingApiError
