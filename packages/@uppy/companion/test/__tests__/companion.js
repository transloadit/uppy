const nock = require('nock')
const request = require('supertest')

const mockOauthState = require('../mockoauthstate')
const { version } = require('../../package.json')
const { nockGoogleDownloadFile } = require('../fixtures/drive')

jest.mock('tus-js-client')
jest.mock('../../src/server/helpers/oauth-state', () => ({
  ...jest.requireActual('../../src/server/helpers/oauth-state'),
  ...mockOauthState(),
}))

const fakeLocalhost = 'localhost.com'

jest.mock('node:dns', () => {
  const actual = jest.requireActual('node:dns')
  return {
    ...actual,
    lookup: (hostname, options, callback) => {
      if (fakeLocalhost === hostname) {
        return callback(null, '127.0.0.1', 4)
      }
      return actual.lookup(hostname, options, callback)
    },
  }
})

const tokenService = require('../../src/server/helpers/jwt')
const { getServer } = require('../mockserver')

// todo don't share server between tests. rewrite to not use env variables
const authServer = getServer({ COMPANION_CLIENT_SOCKET_CONNECT_TIMEOUT: '0' })
const authData = {
  dropbox: 'token value',
  box: 'token value',
  drive: 'token value',
}
const token = tokenService.generateEncryptedToken(authData, process.env.COMPANION_SECRET)
const OAUTH_STATE = 'some-cool-nice-encrytpion'

afterAll(() => {
  nock.cleanAll()
  nock.restore()
})

describe('validate upload data', () => {
  test('invalid upload protocol gets rejected', () => {
    nockGoogleDownloadFile()

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
    nockGoogleDownloadFile()

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
    nockGoogleDownloadFile()

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
    nockGoogleDownloadFile()

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
    nockGoogleDownloadFile()

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
    nockGoogleDownloadFile({ times: 2 })

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
    nockGoogleDownloadFile({ times: 2 })

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
}, 3000)

async function runUrlMetaTest (url) {
  const server = getServer()

  return request(server)
    .post('/url/meta')
    .send({ url })
}

async function runUrlGetTest (url) {
  const server = getServer()

  return request(server)
    .post('/url/get')
    .send({
      fileId: url,
      metadata: {},
      endpoint: 'http://url.myendpoint.com/files',
      protocol: 'tus',
      size: null,
      url,
    })
}

it('respects allowLocalUrls, localhost', async () => {
  let res = await runUrlMetaTest('http://localhost/')
  expect(res.statusCode).toBe(400)
  expect(res.body).toEqual({ error: 'Invalid request body' })

  res = await runUrlGetTest('http://localhost/')
  expect(res.statusCode).toBe(400)
  expect(res.body).toEqual({ error: 'Invalid request body' })
})

it('respects allowLocalUrls, valid hostname that resolves to localhost', async () => {
  let res = await runUrlMetaTest(`http://${fakeLocalhost}/`)
  expect(res.statusCode).toBe(500)
  expect(res.body).toEqual({ message: 'failed to fetch URL metadata' })

  res = await runUrlGetTest(`http://${fakeLocalhost}/`)
  expect(res.statusCode).toBe(500)
  expect(res.body).toEqual({ message: 'failed to fetch URL' })
})
