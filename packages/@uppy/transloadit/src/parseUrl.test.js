const parseUrl = require('./parseUrl')

describe('Transloadit/parseUrl', () => {
  it('splits a url into origin and pathname', () => {
    expect(parseUrl('http://api2.transloadit.com/ws2012')).toEqual({
      origin: 'http://api2.transloadit.com',
      pathname: '/ws2012'
    })
  })

  it('defaults to pathname=/ if absent', () => {
    expect(parseUrl('http://api2.transloadit.com')).toEqual({
      origin: 'http://api2.transloadit.com',
      pathname: '/'
    })
  })
})
