/* global jest:false, test:false, expect:false, describe:false */

const mockOauthState = require('../mockoauthstate')()
const { version } = require('../../package.json')

jest.mock('tus-js-client')
jest.mock('purest')
jest.mock('../../src/server/helpers/oauth-state', () => ({
  ...jest.requireActual('../../src/server/helpers/oauth-state'),
  ...mockOauthState,
}))

const nock = require('nock')
const request = require('supertest')
const tokenService = require('../../src/server/helpers/jwt')
const { getServer } = require('../mockserver')

const authServer = getServer()
const authData = {
  dropbox: 'token value',
  box: 'token value',
  drive: 'token value',
}
const token = tokenService.generateEncryptedToken(authData, process.env.COMPANION_SECRET)
const OAUTH_STATE = 'some-cool-nice-encrytpion'

describe('validate upload data', () => {
  test('invalid upload protocol gets rejected', () => {
    return request(authServer)
      .post('/drive/get/DUMMY-FILE-ID')
      .set('uppy-auth-token', token)
      .set('Content-Type', 'application/json')
      .send({
        endpoint: 'http://url.myendpoint.com/files',
        protocol: 'tusInvalid',
      })
      .expect(400)
      .then((res) => expect(res.body.message).toBe('unsupported protocol specified'))
  })

  test('invalid upload fieldname gets rejected', () => {
    return request(authServer)
      .post('/drive/get/DUMMY-FILE-ID')
      .set('uppy-auth-token', token)
      .set('Content-Type', 'application/json')
      .send({
        endpoint: 'http://url.myendpoint.com/files',
        protocol: 'tus',
        fieldname: 390,
      })
      .expect(400)
      .then((res) => expect(res.body.message).toBe('fieldname must be a string'))
  })

  test('invalid upload metadata gets rejected', () => {
    return request(authServer)
      .post('/drive/get/DUMMY-FILE-ID')
      .set('uppy-auth-token', token)
      .set('Content-Type', 'application/json')
      .send({
        endpoint: 'http://url.myendpoint.com/files',
        protocol: 'tus',
        metadata: 'I am a string instead of object',
      })
      .expect(400)
      .then((res) => expect(res.body.message).toBe('metadata must be an object'))
  })

  test('invalid upload headers get rejected', () => {
    return request(authServer)
      .post('/drive/get/DUMMY-FILE-ID')
      .set('uppy-auth-token', token)
      .set('Content-Type', 'application/json')
      .send({
        endpoint: 'http://url.myendpoint.com/files',
        protocol: 'tus',
        headers: 'I am a string instead of object',
      })
      .expect(400)
      .then((res) => expect(res.body.message).toBe('headers must be an object'))
  })

  test('invalid upload HTTP Method gets rejected', () => {
    return request(authServer)
      .post('/drive/get/DUMMY-FILE-ID')
      .set('uppy-auth-token', token)
      .set('Content-Type', 'application/json')
      .send({
        endpoint: 'http://url.myendpoint.com/files',
        protocol: 'tus',
        httpMethod: 'DELETE',
      })
      .expect(400)
      .then((res) => expect(res.body.message).toBe('unsupported HTTP METHOD specified'))
  })

  test('valid upload data is allowed - tus', () => {
    return request(authServer)
      .post('/drive/get/DUMMY-FILE-ID')
      .set('uppy-auth-token', token)
      .set('Content-Type', 'application/json')
      .send({
        endpoint: 'http://url.myendpoint.com/files',
        protocol: 'tus',
        httpMethod: 'POST',
        headers: {
          customheader: 'header value',
        },
        metadata: {
          mymetadata: 'matadata value',
        },
        fieldname: 'uploadField',
      })
      .expect(200)
  })

  test('valid upload data is allowed - s3-multipart', () => {
    return request(authServer)
      .post('/drive/get/DUMMY-FILE-ID')
      .set('uppy-auth-token', token)
      .set('Content-Type', 'application/json')
      .send({
        endpoint: 'http://url.myendpoint.com/files',
        protocol: 's3-multipart',
        httpMethod: 'PUT',
        headers: {
          customheader: 'header value',
        },
        metadata: {
          mymetadata: 'matadata value',
        },
        fieldname: 'uploadField',
      })
      .expect(200)
  })
})

describe('handle main oauth redirect', () => {
  const serverWithMainOauth = getServer({
    COMPANION_OAUTH_DOMAIN: 'localhost:3040',
  })
  test('redirect to a valid uppy instance', () => {
    return request(serverWithMainOauth)
      .get(`/dropbox/redirect?state=${OAUTH_STATE}`)
      .set('uppy-auth-token', token)
      .expect(302)
      .expect('Location', `http://localhost:3020/connect/dropbox/callback?state=${OAUTH_STATE}`)
  })

  test('do not redirect to invalid uppy instances', () => {
    const state = 'state-with-invalid-instance-url' // see mock ../../src/server/helpers/oauth-state above
    return request(serverWithMainOauth)
      .get(`/dropbox/redirect?state=${state}`)
      .set('uppy-auth-token', token)
      .expect(400)
  })
})

it('periodically pings', (done) => {
  nock('http://localhost').post('/ping', (body) => (
    body.some === 'value'
    && body.version === version
    && typeof body.processId === 'string'
  )).reply(200, () => done())

  getServer({
    COMPANION_PERIODIC_PING_URLS: 'http://localhost/ping',
    COMPANION_PERIODIC_PING_STATIC_JSON_PAYLOAD: '{"some": "value"}',
    COMPANION_PERIODIC_PING_INTERVAL: '10',
    COMPANION_PERIODIC_PING_COUNT: '1',
  })
}, 1000)

afterAll(() => {
  nock.cleanAll()
  nock.restore()
})
