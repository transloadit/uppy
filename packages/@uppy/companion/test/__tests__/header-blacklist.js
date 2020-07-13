/* global test:false, expect:false, describe:false, */

const headerSanitize = require('../../src/server/header-blacklist')

describe('Header black-list testing', () => {
  test('All headers invalid by name', () => {
    const headers = headerSanitize({
      origin: 'http://www.transloadit.com',
      'Accept-Charset': '...',
      'content-Length': 1234
    })

    expect(headers).toEqual({})
  })

  test('All headers invalid by regex', () => {
    const headers = headerSanitize({
      'Proxy-header-fake': 'proxy-header-fake',
      'proxy-header-fake-lower': 'proxy-header-fake-lower',
      'proxy-': 'proxy-header-fake-empty',
      'Sec-': 'sec-header-empty',
      'sec-': 'sec-lower-header-empty',
      'Sec-header-fake': 'sec-header-fake',
      'sec-header-fake': 'sec-header-fake'
    })
    expect(headers).toEqual({})
  })

  test('All headers invalid by name and regex', () => {
    const headers = headerSanitize({
      'Proxy-header-fake': 'proxy-header-fake',
      'Sec-header-fake': 'sec-header-fake'
    })
    expect(headers).toEqual({})
  })

  test('Returning only allowed headers', () => {
    const headers = headerSanitize({
      Authorization: 'Basic Xxxxxx',
      'Content-Type': 'application/json',
      'Content-Length': 1234,
      Expires: 'Wed, 21 Oct 2015 07:28:00 GMT',
      Origin: 'http://www.transloadit.com'
    })
    expect(Object.keys(headers)).toHaveLength(3)
    expect(headers).toHaveProperty('Authorization')
    expect(headers).toHaveProperty('Content-Type')
    expect(headers).toHaveProperty('Expires')
  })

  test('Return empty object when headers is not an object', () => {
    expect(headerSanitize({})).toEqual({})
    expect(headerSanitize(null)).toEqual({})
    expect(headerSanitize(undefined)).toEqual({})
    expect(headerSanitize('Authorization: Basic 1234')).toEqual({})
    expect(headerSanitize(['Authorization', 'Basic 1234'])).toEqual({})
  })
})
