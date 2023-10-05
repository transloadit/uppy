const { after: afterAll, test, describe } = require('node:test')
const expect = require('expect').default

function mock (package, replacer) {
  const actualPath = require.resolve(package)
  if (arguments.length === 1) {
    // eslint-disable-next-line import/no-dynamic-require,global-require
    require.cache[actualPath] = require(`../__mocks__/${package}`)
  } else {
    // eslint-disable-next-line import/no-dynamic-require,global-require
    const actual = require(package)
    const Module = require('node:module') // eslint-disable-line global-require
    require.cache[actualPath] = new Module(actualPath, module)
    Object.defineProperties(require.cache[actualPath], {
      exports: {
        __proto__: null,
        value: replacer(actual),
      },
      resetFn: { __proto__: null, value: replacer.bind(null, actual) },
    })
  }
}
// mocking request module used to fetch custom oauth credentials
mock('request', () => {
  // eslint-disable-next-line global-require
  const { remoteZoomKey, remoteZoomSecret, remoteZoomVerificationToken } = require('../fixtures/zoom').expects

  return {
    post: (url, options, done) => {
      if (url === 'http://localhost:2111/zoom-keys') {
        const { body } = options
        if (body.provider !== 'zoom') {
          return done(new Error('wrong provider'))
        }

        if (body.parameters !== 'ZOOM-CREDENTIALS-PARAMS') {
          return done(new Error('wrong params'))
        }

        const respBody = {
          credentials: {
            key: remoteZoomKey,
            secret: remoteZoomSecret,
            verificationToken: remoteZoomVerificationToken,
          },
        }
        return done(null, { statusCode: 200, body: respBody }, respBody)
      }

      return done(new Error('unsupported request with mock function'))
    },
  }
})

const request = require('supertest')
const nock = require('nock')
const tokenService = require('../../src/server/helpers/jwt')
const { getServer } = require('../mockserver')
const { nockZoomRevoke } = require('../fixtures/zoom')

const { remoteZoomKey, remoteZoomSecret, remoteZoomVerificationToken } = require('../fixtures/zoom').expects

const authServer = getServer({ COMPANION_ZOOM_KEYS_ENDPOINT: 'http://localhost:2111/zoom-keys' })
const authData = {
  zoom: { accessToken: 'token value' },
}
const token = tokenService.generateEncryptedAuthToken(authData, process.env.COMPANION_SECRET)

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
