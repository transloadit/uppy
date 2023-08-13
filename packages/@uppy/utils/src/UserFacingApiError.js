class UserFacingApiError extends Error {
  constructor (message) {
    super(message)
    this.name = 'UserFacingApiError'
  }
}

export default UserFacingApiError
