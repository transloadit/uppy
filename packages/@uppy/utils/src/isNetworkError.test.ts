import { describe, expect, it } from 'vitest'
import isNetworkError from './isNetworkError.js'

describe('isNetworkError', () => {
  it('should return true if the specified xhr object contains a network error', () => {
    const xhrNetworkErrorMock = {
      readyState: 4,
      responseText: '',
      status: 0,
    } as any as XMLHttpRequest

    const xhrNetworkError2Mock = {
      readyState: 2,
      responseText: '',
      status: 300,
    } as any as XMLHttpRequest

    const xhrRegularErrorMock = {
      readyState: 4,
      responseText: 'Failed',
      status: 400,
    } as any as XMLHttpRequest

    const xhrNetworkSuccessMock = {
      readyState: 4,
      responseText: 'Success',
      status: 200,
    } as any as XMLHttpRequest

    expect(isNetworkError(xhrNetworkErrorMock)).toEqual(true)
    expect(isNetworkError(xhrNetworkError2Mock)).toEqual(true)
    expect(isNetworkError(xhrRegularErrorMock)).toEqual(false)
    expect(isNetworkError(xhrNetworkSuccessMock)).toEqual(false)
  })
})
