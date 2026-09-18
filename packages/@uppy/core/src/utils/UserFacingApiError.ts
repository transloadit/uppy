/**
 * An error whose `message` is a locale key to show the user (Companion reports
 * user-facing failures this way; a plugin may throw one for the same effect).
 */
class UserFacingApiError extends Error {
  name = 'UserFacingApiError'
}

export default UserFacingApiError
