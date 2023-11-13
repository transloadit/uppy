'use strict'

class AuthError extends Error {
  public isAuthError: true

  constructor () {
    super('Authorization required')
    this.name = 'AuthError'
    this.isAuthError = true
  }
}

export default AuthError
