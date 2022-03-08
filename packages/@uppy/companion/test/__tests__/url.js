/* global jest:false, test:false, expect:false, describe:false */

const nock = require('nock')
const request = require('supertest')

jest.mock('tus-js-client')
jest.mock('../../src/server/helpers/request', () => {
  return {
    ...jest.requireActual('../../src/server/helpers/request'),
    getURLMeta: () => {
      return Promise.resolve({ size: 7580, type: 'image/jpg' })
    },
  }
})
const { getServer } = require('../mockserver')

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
