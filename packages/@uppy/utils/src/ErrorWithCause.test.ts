import { describe, expect, it } from 'vitest'
import ErrorWithCause from './ErrorWithCause.ts'
import NetworkError from './NetworkError.ts'

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
    expect(
      new ErrorWithCause('message', { cause: networkError }).isNetworkError,
    ).toEqual(true)
    expect(
      new ErrorWithCause('message', { cause: regularError }).isNetworkError,
    ).toEqual(false)
    expect(new ErrorWithCause('message', {}).isNetworkError).toEqual(false)
    expect(new ErrorWithCause('message').isNetworkError).toEqual(false)
  })
})
