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

export default AuthError
