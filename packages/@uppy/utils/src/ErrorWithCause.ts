import hasProperty from './hasProperty.ts'

class ErrorWithCause extends Error {
  public isNetworkError?: boolean

  public cause: Error['cause']

  constructor(message?: string, options?: ErrorOptions) {
    super(message)
    this.cause = options?.cause
    if (this.cause && hasProperty(this.cause, 'isNetworkError')) {
      this.isNetworkError = (this.cause as ErrorWithCause).isNetworkError
    }
  }
}

export default ErrorWithCause
