const nock = require('nock')
const { getRedirectEvaluator, FORBIDDEN_IP_ADDRESS } = require('../../src/server/helpers/request')
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

  test('blocks localhost IP address', async () => {
    const url = 'http://127.0.0.1:8090'
    const promise = getProtectedGot({ url, blockLocalIPs: true }).get(url)
    await expect(promise).rejects.toThrow(new Error(FORBIDDEN_IP_ADDRESS))
  })
})
