const request = require('supertest')
const nock = require('nock')
const tokenService = require('../../src/server/helpers/jwt')
const { getServer } = require('../mockserver')

const { remoteZoomKey: mockRemoteZoomKey, remoteZoomSecret: mockRemoteZoomSecret, remoteZoomVerificationToken: mockRemoteZoomVerificationToken } = require('../fixtures/zoom').expects

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
      if (provider !== 'zoom' || parameters !== 'ZOOM-CREDENTIALS-PARAMS') {
        return [400]
      }
      return [
        200,
        {
          credentials: {
            key: mockRemoteZoomKey,
            secret: mockRemoteZoomSecret,
            verificationToken: mockRemoteZoomVerificationToken,
          },
        },
      ]
    }).persist()

  nock('https://zoom.us').post('/oauth/revoke?token=token+value').reply(200, { status: 'success' })

  test('zoom logout with remote oauth keys happy path', () => {
    const params = { params: 'ZOOM-CREDENTIALS-PARAMS' }
    const encodedParams = Buffer.from(JSON.stringify(params), 'binary').toString('base64')
    return request(authServer)
      .get('/zoom/logout/')
      .set('uppy-auth-token', token)
      .set('uppy-credentials-params', encodedParams)
      .expect(200)
      .then((res) => expect(res.body.ok).toBe(true))
  })

  test('zoom logout with wrong credentials params', () => {
    const params = { params: 'WRONG-ZOOM-CREDENTIALS-PARAMS' }
    const encodedParams = Buffer.from(JSON.stringify(params), 'binary').toString('base64')
    return request(authServer)
      .get('/zoom/logout/')
      .set('uppy-auth-token', token)
      .set('uppy-credentials-params', encodedParams)
      // todo: handle failures differently to return 400 for this case instead
      .expect(500)
  })
})
