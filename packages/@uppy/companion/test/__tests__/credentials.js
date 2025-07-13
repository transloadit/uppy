import nock from 'nock'
import request from 'supertest'
import tokenService from '../../src/server/helpers/jwt.js'
import { nockZoomRevoke, expects as zoomExpects } from '../fixtures/zoom.js'
import { getServer } from '../mockserver.js'

const { remoteZoomKey, remoteZoomSecret, remoteZoomVerificationToken } =
  zoomExpects

const authServer = getServer({
  COMPANION_ZOOM_KEYS_ENDPOINT: 'http://localhost:2111/zoom-keys',
})
const authData = {
  zoom: { accessToken: 'token value' },
}
const token = tokenService.generateEncryptedAuthToken(
  authData,
  process.env.COMPANION_SECRET,
)

afterAll(() => {
  nock.cleanAll()
  nock.restore()
})

describe('providers requests with remote oauth keys', () => {
  // mocking request module used to fetch custom oauth credentials
  nock('http://localhost:2111')
    .post('/zoom-keys')
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
    .persist()

  test('zoom logout with remote oauth keys happy path', async () => {
    nockZoomRevoke({ key: remoteZoomKey, secret: remoteZoomSecret })

    const params = { params: 'ZOOM-CREDENTIALS-PARAMS' }
    const encodedParams = Buffer.from(
      JSON.stringify(params),
      'binary',
    ).toString('base64')
    const res = await request(authServer)
      .get('/zoom/logout/')
      .set('uppy-auth-token', token)
      .set('uppy-credentials-params', encodedParams)
      .expect(200)

    expect(res.body).toMatchObject({
      ok: true,
      revoked: true,
    })
  })

  test('zoom logout with wrong credentials params', () => {
    const params = { params: 'WRONG-ZOOM-CREDENTIALS-PARAMS' }
    const encodedParams = Buffer.from(
      JSON.stringify(params),
      'binary',
    ).toString('base64')
    return request(authServer)
      .get('/zoom/logout/')
      .set('uppy-auth-token', token)
      .set('uppy-credentials-params', encodedParams)
      .expect(424)
  })
})
