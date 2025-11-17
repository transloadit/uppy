import nock from 'nock'
import request from 'supertest'
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest'
import * as tokenService from '../src/server/helpers/jwt.js'
import { nockZoomRevoke, expects as zoomExpects } from './fixtures/zoom.js'
import { getServer } from './mockserver.js'

const { remoteZoomKey, remoteZoomSecret, remoteZoomVerificationToken } =
  zoomExpects

vi.mock('express-prom-bundle')

const secret = 'secret'

const getZoomServer = async () =>
  getServer({
    COMPANION_ZOOM_KEYS_ENDPOINT: 'http://localhost:2111/zoom-keys',
  })
const authData = {
  zoom: { accessToken: 'token value' },
}
const token = tokenService.generateEncryptedAuthToken(authData, secret)

afterEach(() => {
  nock.cleanAll()
})
afterAll(() => {
  nock.restore()
})

describe('providers requests with remote oauth keys', () => {
  beforeEach(() => {
    // mocking request module used to fetch custom oauth credentials
    nock('http://localhost:2111')
      .post('/zoom-keys')
      // @ts-ignore
      .reply((uri, { provider, parameters }) => {
        if (provider !== 'zoom' || parameters !== 'ZOOM-CREDENTIALS-PARAMS')
          return [400]

        return [
          200,
          {
            credentials: {
              key: remoteZoomKey,
              secret: remoteZoomSecret,
              verificationToken: remoteZoomVerificationToken,
            },
          },
        ]
      })
  })

  test('zoom logout with remote oauth keys happy path', async () => {
    nockZoomRevoke({ key: remoteZoomKey, secret: remoteZoomSecret })

    const params = { params: 'ZOOM-CREDENTIALS-PARAMS' }
    const encodedParams = Buffer.from(
      JSON.stringify(params),
      'binary',
    ).toString('base64')
    const res = await request(await getZoomServer())
      .get('/zoom/logout/')
      .set('uppy-auth-token', token)
      .set('uppy-credentials-params', encodedParams)
      .expect(200)

    expect(res.body).toMatchObject({
      ok: true,
      revoked: true,
    })
  })

  test('zoom logout with wrong credentials params', async () => {
    nockZoomRevoke({ key: remoteZoomKey, secret: remoteZoomSecret })

    const params = { params: 'WRONG-ZOOM-CREDENTIALS-PARAMS' }
    const encodedParams = Buffer.from(
      JSON.stringify(params),
      'binary',
    ).toString('base64')
    return request(await getZoomServer())
      .get('/zoom/logout/')
      .set('uppy-auth-token', token)
      .set('uppy-credentials-params', encodedParams)
      .expect(424)
  })
})
