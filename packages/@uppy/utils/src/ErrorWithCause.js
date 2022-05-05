const hasProperty = require('./hasProperty')

class ErrorWithCause extends Error {
  constructor (message, options = {}) {
    super(message)
    this.cause = options.cause
    if (this.cause && hasProperty(this.cause, 'isNetworkError')) {
      this.isNetworkError = this.cause.isNetworkError
    }
  }
}

module.exports = ErrorWithCause
