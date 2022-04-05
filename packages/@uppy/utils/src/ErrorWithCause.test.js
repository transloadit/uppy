const ErrorWithCause = require('./ErrorWithCause')
const NetworkError = require('./NetworkError')
const isNetworkError = require('./isNetworkError')

describe('ErrorWithCause', () => {
  it('should support a `{ cause }` option', () => {
    const cause = new Error('cause')
    expect(new ErrorWithCause('message').cause).toEqual(undefined)
    expect(new ErrorWithCause('message', {}).cause).toEqual(undefined)
    expect(new ErrorWithCause('message', { cause }).cause).toEqual(cause)
  })
  it('should propagate isNetworkError', () => {
    const regularError = new Error('cause')
    const networkError = new NetworkError('cause')
    expect(isNetworkError(new ErrorWithCause('message', { cause: networkError }).isNetworkError)).toEqual(true)
    expect(isNetworkError(new ErrorWithCause('message', { cause: regularError }).isNetworkError)).toEqual(false)
    expect(isNetworkError(new ErrorWithCause('message', {}).isNetworkError)).toEqual(false)
    expect(isNetworkError(new ErrorWithCause('message').isNetworkError)).toEqual(false)
  })
})
