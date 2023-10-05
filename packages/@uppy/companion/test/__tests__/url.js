const { before: beforeAll, after: afterAll, describe, it:test } = require('node:test')
const expect = require('expect').default

require.cache[require.resolve('tus-js-client')] = require('../__mocks__/tus-js-client')

{
  const request = require.resolve('../../src/server/helpers/request')
  require(request) // eslint-disable-line global-require,import/no-dynamic-require
  require.cache[request].getURLMeta = () => {
    return Promise.resolve({ size: 7580, type: 'image/jpg' })
  }
}

const nock = require('nock')
const request = require('supertest')
const { getServer } = require('../mockserver')

test.each = function each (iterable) {
  return (message, fn) => {
    for (const val of iterable) {
      test(message, fn.bind(null, val))
    }
  }
}

const mockServer = getServer({ COMPANION_CLIENT_SOCKET_CONNECT_TIMEOUT: '0' })

beforeAll(() => {
  nock('http://url.myendpoint.com').get('/files').reply(200, () => '')
})

afterAll(() => {
  nock.cleanAll()
  nock.restore()
})

const invalids = [
  // no url at all or unsupported protocol
  null, '', 'ftp://url.myendpoint.com/files',
]

describe('url meta', () => {
  test('return a url\'s meta data', () => {
    return request(mockServer)
      .post('/url/meta')
      .set('Content-Type', 'application/json')
      .send({
        url: 'http://url.myendpoint.com/files',
      })
      .expect(200)
      .then((res) => {
        expect(res.body.size).toBe(7580)
        expect(res.body.type).toBe('image/jpg')
      })
  })

  test.each(invalids)('return 400 for invalid url', (urlCase) => {
    return request(mockServer)
      .post('/url/meta')
      .set('Content-Type', 'application/json')
      .send({
        url: urlCase,
      })
      .expect(400)
      .then((res) => expect(res.body.error).toBe('Invalid request body'))
  })
})

describe('url get', () => {
  test('url download gets instanitated', () => {
    return request(mockServer)
      .post('/url/get')
      .set('Content-Type', 'application/json')
      .send({
        url: 'http://url.myendpoint.com/files',
        endpoint: 'http://tusd.tusdemo.net/files',
        protocol: 'tus',
      })
      .expect(200)
      .then((res) => expect(res.body.token).toBeTruthy())
  })

  test.each(invalids)('downloads are not instantiated for invalid urls', (urlCase) => {
    return request(mockServer)
      .post('/url/get')
      .set('Content-Type', 'application/json')
      .send({
        url: urlCase,
        endpoint: 'http://tusd.tusdemo.net/files',
        protocol: 'tus',
      })
      .expect(400)
      .then((res) => expect(res.body.error).toBe('Invalid request body'))
  })
})
