/* global jest:false, test:false, describe:false, expect:false */

const { cors } = require('../../src/server/middlewares')

function testWithMock ({ corsOptions, get = () => {}, origin = 'https://localhost:1234' } = {}) {
  const res = {
    get,
    getHeader: get,
    setHeader: jest.fn(),
    end: jest.fn(),
  }
  const req = {
    method: 'OPTIONS',
    headers: {
      origin,
    },
  }
  const next = jest.fn()
  cors(corsOptions)(req, res, next)
  return { res }
}

describe('cors', () => {
  test('should properly merge with existing headers', () => {
    const get = (header) => {
      if (header.toLowerCase() === 'access-control-allow-methods') return 'PATCH,OPTIONS, post'
      if (header.toLowerCase() === 'access-control-allow-headers') return 'test-allow-header'
      if (header.toLowerCase() === 'access-control-expose-headers') return 'test'
      return undefined
    }

    const { res } = testWithMock({
      corsOptions: {
        sendSelfEndpoint: true,
        corsOrigins: /^https:\/\/localhost:.*$/,
      },
      get,
    })
    expect(res.setHeader.mock.calls).toEqual([
      ['Access-Control-Allow-Origin', 'https://localhost:1234'],
      ['Vary', 'Origin'],
      ['Access-Control-Allow-Credentials', 'true'],
      ['Access-Control-Allow-Methods', 'PATCH,OPTIONS,POST,GET,DELETE'],
      ['Access-Control-Allow-Headers', 'test-allow-header,uppy-auth-token,uppy-versions,uppy-credentials-params,authorization,origin,content-type,accept'],
      ['Access-Control-Expose-Headers', 'test,access-control-allow-headers,i-am'],
      ['Content-Length', '0'],
    ])
    // expect(next).toHaveBeenCalled()
  })

  test('should also work when nothing added', () => {
    const { res } = testWithMock()
    expect(res.setHeader.mock.calls).toEqual([
      ['Access-Control-Allow-Origin', 'https://localhost:1234'],
      ['Vary', 'Origin'],
      ['Access-Control-Allow-Credentials', 'true'],
      ['Access-Control-Allow-Methods', 'GET,POST,OPTIONS,DELETE'],
      ['Access-Control-Allow-Headers', 'uppy-auth-token,uppy-versions,uppy-credentials-params,authorization,origin,content-type,accept'],
      ['Access-Control-Expose-Headers', 'access-control-allow-headers'],
      ['Content-Length', '0'],
    ])
  })

  test('should support disabling cors', () => {
    const { res } = testWithMock({ corsOptions: { corsOrigins: false } })
    expect(res.setHeader.mock.calls).toEqual([])
  })

  test('should support incorrect url', () => {
    const { res } = testWithMock({ corsOptions: { corsOrigins: /^incorrect$/ } })
    expect(res.setHeader.mock.calls).toEqual([
      ['Vary', 'Origin'],
      ['Access-Control-Allow-Credentials', 'true'],
      ['Access-Control-Allow-Methods', 'GET,POST,OPTIONS,DELETE'],
      ['Access-Control-Allow-Headers', 'uppy-auth-token,uppy-versions,uppy-credentials-params,authorization,origin,content-type,accept'],
      ['Access-Control-Expose-Headers', 'access-control-allow-headers'],
      ['Content-Length', '0'],
    ])
  })

  test('should support array origin', () => {
    const { res } = testWithMock({ corsOptions: { corsOrigins: ['http://google.com', 'https://localhost:1234'] } })
    expect(res.setHeader.mock.calls).toEqual([
      ['Access-Control-Allow-Origin', 'https://localhost:1234'],
      ['Vary', 'Origin'],
      ['Access-Control-Allow-Credentials', 'true'],
      ['Access-Control-Allow-Methods', 'GET,POST,OPTIONS,DELETE'],
      ['Access-Control-Allow-Headers', 'uppy-auth-token,uppy-versions,uppy-credentials-params,authorization,origin,content-type,accept'],
      ['Access-Control-Expose-Headers', 'access-control-allow-headers'],
      ['Content-Length', '0'],
    ])
  })
})
