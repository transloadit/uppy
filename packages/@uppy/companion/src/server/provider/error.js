/**
 * AuthError is error returned when an adapter encounters
 * an authorization error while communication with its corresponding provider
 */
class AuthError extends Error {
  constructor () {
    super('invalid access token detected by Provider')
    this.name = 'AuthError'
    this.isAuthError = true
  }
}

module.exports = AuthError
