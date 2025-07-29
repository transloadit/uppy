import nock from 'nock'
import request from 'supertest'
import { afterAll, describe, expect, it, test, vi } from 'vitest'
import packageJson from '../package.json' with { type: 'json' }
import * as tokenService from '../src/server/helpers/jwt.js'
import * as defaults from './fixtures/constants.js'
import { nockGoogleDownloadFile } from './fixtures/drive.js'
import mockOauthState from './mockoauthstate.js'
import { getServer } from './mockserver.js'

vi.mock('express-prom-bundle')
vi.mock('tus-js-client')
mockOauthState()

const fakeLocalhost = 'localhost.com'

vi.mock('node:dns', () => ({
  default: {
    lookup: (hostname, options, callback) => {
      if (fakeLocalhost === hostname || hostname === 'localhost') {
        return callback(null, '127.0.0.1', 4)
      }
      return callback(new Error(`Unexpected call to hostname ${hostname}`))
    },
  },
}))

const getServerWithEnv = async () =>
  getServer({ COMPANION_CLIENT_SOCKET_CONNECT_TIMEOUT: '0' })

const secret = 'secret'
const authData = {
  dropbox: { accessToken: 'token value' },
  box: { accessToken: 'token value' },
  drive: { accessToken: 'token value' },
}
const token = tokenService.generateEncryptedAuthToken(authData, secret)
const OAUTH_STATE = 'some-cool-nice-encrytpion'

afterAll(() => {
  nock.cleanAll()
  nock.restore()
})

describe('validate upload data', () => {
  test('access token expired or invalid when starting provider download', async () => {
    const meta = {
      size: null,
      mimeType: 'video/mp4',
      id: defaults.ITEM_ID,
    }
    nock('https://www.googleapis.com')
      .get(`/drive/v3/files/${defaults.ITEM_ID}`)
      .query(() => true)
      .reply(200, meta)

    nock('https://www.googleapis.com')
      .get(
        `/drive/v3/files/${defaults.ITEM_ID}?alt=media&supportsAllDrives=true`,
      )
      .reply(401, {
        error: {
          code: 401,
          message:
            'Request had invalid authentication credentials. Expected OAuth 2 access token, login cookie or other valid authentication credential. See https://developers.google.com/identity/sign-in/web/devconsole-project.',
          status: 'UNAUTHENTICATED',
        },
      })

    return request(await getServerWithEnv())
      .post('/drive/get/DUMMY-FILE-ID')
      .set('uppy-auth-token', token)
      .set('Content-Type', 'application/json')
      .send({
        endpoint: 'http://url.myendpoint.com/files',
        protocol: 'tus',
        httpMethod: 'POST',
      })
      .expect(401)
      .then((res) =>
        expect(res.body.message).toBe(
          'HTTP 401: invalid access token detected by Provider',
        ),
      )
  })

  test('invalid upload protocol gets rejected', async () => {
    nockGoogleDownloadFile()

    return request(await getServerWithEnv())
      .post('/drive/get/DUMMY-FILE-ID')
      .set('uppy-auth-token', token)
      .set('Content-Type', 'application/json')
      .send({
        endpoint: 'http://url.myendpoint.com/files',
        protocol: 'tusInvalid',
      })
      .expect(400)
      .then((res) =>
        expect(res.body.message).toBe('unsupported protocol specified'),
      )
  })

  test('invalid upload fieldname gets rejected', async () => {
    nockGoogleDownloadFile()

    return request(await getServerWithEnv())
      .post('/drive/get/DUMMY-FILE-ID')
      .set('uppy-auth-token', token)
      .set('Content-Type', 'application/json')
      .send({
        endpoint: 'http://url.myendpoint.com/files',
        protocol: 'tus',
        fieldname: 390,
      })
      .expect(400)
      .then((res) =>
        expect(res.body.message).toBe('fieldname must be a string'),
      )
  })

  test('invalid upload metadata gets rejected', async () => {
    nockGoogleDownloadFile()

    return request(await getServerWithEnv())
      .post('/drive/get/DUMMY-FILE-ID')
      .set('uppy-auth-token', token)
      .set('Content-Type', 'application/json')
      .send({
        endpoint: 'http://url.myendpoint.com/files',
        protocol: 'tus',
        metadata: 'I am a string instead of object',
      })
      .expect(400)
      .then((res) =>
        expect(res.body.message).toBe('metadata must be an object'),
      )
  })

  test('invalid upload headers get rejected', async () => {
    nockGoogleDownloadFile()

    return request(await getServerWithEnv())
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

  test('invalid upload HTTP Method gets rejected', async () => {
    nockGoogleDownloadFile()

    return request(await getServerWithEnv())
      .post('/drive/get/DUMMY-FILE-ID')
      .set('uppy-auth-token', token)
      .set('Content-Type', 'application/json')
      .send({
        endpoint: 'http://url.myendpoint.com/files',
        protocol: 'tus',
        httpMethod: 'DELETE',
      })
      .expect(400)
      .then((res) =>
        expect(res.body.message).toBe('unsupported HTTP METHOD specified'),
      )
  })

  test('valid upload data is allowed - tus', async () => {
    nockGoogleDownloadFile()

    return request(await getServerWithEnv())
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

  test('valid upload data is allowed - s3-multipart', async () => {
    nockGoogleDownloadFile()

    return request(await getServerWithEnv())
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

describe('handle main oauth redirect', async () => {
  const serverWithMainOauth = await getServer({
    COMPANION_OAUTH_DOMAIN: 'localhost:3040',
  })
  test('redirect to a valid uppy instance', () => {
    return request(serverWithMainOauth)
      .get(`/dropbox/redirect?state=${OAUTH_STATE}`)
      .set('uppy-auth-token', token)
      .expect(302)
      .expect(
        'Location',
        `http://localhost:3020/connect/dropbox/callback?state=${OAUTH_STATE}`,
      )
  })

  test('do not redirect to invalid uppy instances', () => {
    const state = 'state-with-invalid-instance-url' // see mock ../../src/server/helpers/oauth-state above
    return request(serverWithMainOauth)
      .get(`/dropbox/redirect?state=${state}`)
      .set('uppy-auth-token', token)
      .expect(400)
  })
})

it('periodically pings', async () => {
  await Promise.all([
    getServer({
      COMPANION_PERIODIC_PING_URLS: 'http://localhost/ping',
      COMPANION_PERIODIC_PING_STATIC_JSON_PAYLOAD: '{"some": "value"}',
      COMPANION_PERIODIC_PING_INTERVAL: '10',
      COMPANION_PERIODIC_PING_COUNT: '1',
    }),
    new Promise((resolve) => {
      nock('http://localhost')
        .post(
          '/ping',
          (body) =>
            body.some === 'value' &&
            body.version === packageJson.version &&
            typeof body.processId === 'string',
        )
        .reply(200, () => resolve())
    }),
  ])
}, 3000)

async function runUrlMetaTest(url) {
  const server = await getServer()

  return request(server).post('/url/meta').send({ url })
}

async function runUrlGetTest(url) {
  const server = await getServer()

  return request(server).post('/url/get').send({
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

describe('respects allowLocalUrls, valid hostname that resolves to localhost', () => {
  test('meta', async () => {
    const res = await runUrlMetaTest(`http://${fakeLocalhost}/`)
    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({ message: 'failed to fetch URL metadata' })
  })

  test('get', async () => {
    const res = await runUrlGetTest(`http://${fakeLocalhost}/`)
    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({ message: 'failed to fetch URL' })
  })
})
