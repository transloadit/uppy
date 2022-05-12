import hasProperty from './hasProperty.js'

class ErrorWithCause extends Error {
  constructor (message, options = {}) {
    super(message)
    this.cause = options.cause
    if (this.cause && hasProperty(this.cause, 'isNetworkError')) {
      this.isNetworkError = this.cause.isNetworkError
    }
  }
}

export default ErrorWithCause
