'use strict'

class AuthError extends Error {
  constructor () {
    super('Authorization required')
    this.name = 'AuthError'
    this.isAuthError = true
  }
}

module.exports = AuthError
