import hasProperty from './hasProperty.ts'

class ErrorWithCause extends Error {
  public isNetworkError?: boolean

  constructor(
    message: Parameters<typeof Error>[0],
    options: Parameters<typeof Error>[1],
  ) {
    super(message)
    this.cause = options?.cause
    if (this.cause && hasProperty(this.cause, 'isNetworkError')) {
      this.isNetworkError = (this.cause as ErrorWithCause).isNetworkError
    }
  }
}

export default ErrorWithCause
