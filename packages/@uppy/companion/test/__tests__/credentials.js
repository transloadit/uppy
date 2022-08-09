const request = require('supertest')
const nock = require('nock')
const tokenService = require('../../src/server/helpers/jwt')
const { getServer } = require('../mockserver')
const { nockZoomRevoke } = require('../fixtures/zoom')

const { remoteZoomKey, remoteZoomSecret, remoteZoomVerificationToken } = require('../fixtures/zoom').expects

const authServer = getServer({ COMPANION_ZOOM_KEYS_ENDPOINT: 'http://localhost:2111/zoom-keys' })
const authData = {
  zoom: 'token value',
}
const token = tokenService.generateEncryptedToken(authData, process.env.COMPANION_SECRET)

afterAll(() => {
  nock.cleanAll()
  nock.restore()
})

describe('providers requests with remote oauth keys', () => {
  // mocking request module used to fetch custom oauth credentials
  nock('http://localhost:2111')
    .post('/zoom-keys')
    .reply((uri, { provider, parameters }) => {
      if (provider !== 'zoom' || parameters !== 'ZOOM-CREDENTIALS-PARAMS') return [400]

      return [200, {
        credentials: {
          key: remoteZoomKey,
          secret: remoteZoomSecret,
          verificationToken: remoteZoomVerificationToken,
        },
      }]
    }).persist()

  test('zoom logout with remote oauth keys happy path', async () => {
    nockZoomRevoke({ key: remoteZoomKey, secret: remoteZoomSecret })

    const params = { params: 'ZOOM-CREDENTIALS-PARAMS' }
    const encodedParams = Buffer.from(JSON.stringify(params), 'binary').toString('base64')
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
    const encodedParams = Buffer.from(JSON.stringify(params), 'binary').toString('base64')
    return request(authServer)
      .get('/zoom/logout/')
      .set('uppy-auth-token', token)
      .set('uppy-credentials-params', encodedParams)
      .expect(424)
  })
})
