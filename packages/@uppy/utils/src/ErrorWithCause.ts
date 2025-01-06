import type NetworkError from './NetworkError.js'
import hasProperty from './hasProperty.js'

class ErrorWithCause extends Error {
  public isNetworkError: boolean

  public cause: Error['cause']

  constructor(
    message?: ConstructorParameters<ErrorConstructor>[0],
    options?: ConstructorParameters<ErrorConstructor>[1],
  ) {
    super(message)
    this.cause = options?.cause
    if (this.cause && hasProperty(this.cause, 'isNetworkError')) {
      this.isNetworkError = (this.cause as NetworkError).isNetworkError
    } else {
      this.isNetworkError = false
    }
  }
}

export default ErrorWithCause
