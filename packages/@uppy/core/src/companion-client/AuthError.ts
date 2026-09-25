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

// checks the property, as `instanceof AuthError` is unsafe, see above
export function isAuthError(err: unknown): err is AuthError {
  return (
    err instanceof Error && 'isAuthError' in err && err.isAuthError === true
  )
}

export default AuthError
