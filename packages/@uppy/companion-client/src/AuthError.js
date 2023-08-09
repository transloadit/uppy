'use strict'

class AuthError extends Error {
  constructor () {
    super('Authorization required')
    this.name = 'AuthError'
    this.isAuthError = true // todo remove in next major and pull AuthError into a shared package
  }
}

export default AuthError
