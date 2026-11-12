class AuthError extends Error {
  isAuthError: boolean

  constructor() {
    super('Authorization required')
    this.name = 'AuthError'

    // we use a property because of instanceof is unsafe:
    // https://github.com/transloadit/uppy/pull/4619#discussion_r1406225982
    this.isAuthError = true
  }
}

/**
 * Check whether a thrown value is an {@link AuthError}. This checks its
 * `isAuthError` property, as `instanceof AuthError` is unsafe (see above).
 *
 * @param err The thrown value.
 * @returns Whether `err` is an auth error.
 */
export function isAuthError(err: unknown): err is AuthError {
  return (
    err instanceof Error && 'isAuthError' in err && err.isAuthError === true
  )
}

export default AuthError
