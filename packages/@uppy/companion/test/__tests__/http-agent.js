const nock = require('nock')
const { getRedirectEvaluator, FORBIDDEN_IP_ADDRESS, FORBIDDEN_RESOLVED_IP_ADDRESS } = require('../../src/server/helpers/request')
const { getProtectedGot } = require('../../src/server/helpers/request')

describe('test getRedirectEvaluator', () => {
  const httpURL = 'http://uppy.io'
  const httpsURL = 'https://uppy.io'
  const httpRedirectResp = {
    headers: {
      location: 'http://transloadit.com',
    },
  }

  const httpsRedirectResp = {
    headers: {
      location: 'https://transloadit.com',
    },
  }

  test('when original URL has "https:" as protocol', (done) => {
    const shouldRedirectHttps = getRedirectEvaluator(httpsURL, true)
    expect(shouldRedirectHttps(httpsRedirectResp)).toEqual(true)
    expect(shouldRedirectHttps(httpRedirectResp)).toEqual(false)
    done()
  })

  test('when original URL has "http:" as protocol', (done) => {
    const shouldRedirectHttp = getRedirectEvaluator(httpURL, true)
    expect(shouldRedirectHttp(httpRedirectResp)).toEqual(true)
    expect(shouldRedirectHttp(httpsRedirectResp)).toEqual(false)
    done()
  })
})

afterAll(() => {
  nock.cleanAll()
  nock.restore()
})

describe('test protected request Agent', () => {
  test('allows URLs without IP addresses', async () => {
    nock('https://transloadit.com').get('/').reply(200)
    const url = 'https://transloadit.com'
    await getProtectedGot({ url, blockLocalIPs: true }).get(url)
  })

  test('blocks url that resolves to forbidden IP', async () => {
    const url = 'https://localhost'
    const promise = getProtectedGot({ url, blockLocalIPs: true }).get(url)
    await expect(promise).rejects.toThrow(new Error(FORBIDDEN_RESOLVED_IP_ADDRESS))
  })

  test('blocks private http IP address', async () => {
    const url = 'http://172.20.10.4:8090'
    const promise = getProtectedGot({ url, blockLocalIPs: true }).get(url)
    await expect(promise).rejects.toThrow(new Error(FORBIDDEN_IP_ADDRESS))
  })

  test('blocks private https IP address', async () => {
    const url = 'https://172.20.10.4:8090'
    const promise = getProtectedGot({ url, blockLocalIPs: true }).get(url)
    await expect(promise).rejects.toThrow(new Error(FORBIDDEN_IP_ADDRESS))
  })

  test('blocks various private IP addresses', async () => {
    // eslint-disable-next-line max-len
    // taken from: https://github.com/transloadit/uppy/blob/4aeef4dac0490ebb1d1fccd5582ba42c6c0fb87d/packages/%40uppy/companion/src/server/helpers/request.js#L14
    const ipv4s = [
      '0.0.0.0',
      '0.0.0.1',
      '127.0.0.1',
      '127.16.0.1',
      '192.168.1.1',
      '169.254.1.1',
      '10.0.0.1',
    ]

    const ipv6s = [
      'fd80::1234:5678:abcd:0123',
      'fe80::1234:5678:abcd:0123',
      'ff00::1234',
      '::ffff:192.168.1.10',
      '::1',
      '0:0:0:0:0:0:0:1',
      'fda1:3f9f:dbf7::1c8d',
    ]

    for (const ip of ipv4s) {
      const url = `http://${ip}:8090`
      const promise = getProtectedGot({ url, blockLocalIPs: true }).get(url)
      await expect(promise).rejects.toThrow(new Error(FORBIDDEN_IP_ADDRESS))
    }
    for (const ip of ipv6s) {
      const url = `http://[${ip}]:8090`
      const promise = getProtectedGot({ url, blockLocalIPs: true }).get(url)
      await expect(promise).rejects.toThrow(new Error(FORBIDDEN_IP_ADDRESS))
    }
  })
})
