/* global jest:false, test:false, describe:false, expect:false */

const { mergeAccessControlAllowMethods } = require('../../src/server/middlewares')

describe('mergeAccessControlAllowMethods', () => {
  test('should properly merge', () => {
    const res = {
      get: () => 'PATCH,OPTIONS, post',
      header: jest.fn()
    }
    const next = jest.fn()
    mergeAccessControlAllowMethods(undefined, res, next)
    expect(res.header).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'PATCH,OPTIONS,POST,GET,DELETE')
    expect(next).toHaveBeenCalled()
  })
  test('should also work when nothing added', () => {
    const res = {
      get: () => undefined,
      header: jest.fn()
    }
    const next = jest.fn()
    mergeAccessControlAllowMethods(undefined, res, next)
    expect(res.header).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,DELETE')
    expect(next).toHaveBeenCalled()
  })
})
