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
import * as tokenService from '../dist/server/helpers/jwt.js'
import * as oAuthState from '../dist/server/helpers/oauth-state.js'
import logger from '../dist/server/logger.js'
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
      // @ts-expect-error
      .reply((_uri, { provider, parameters }) => {
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

describe('remote credentials with transloadit_gateway', () => {
  const getDropboxServer = () =>
    getServer({
      COMPANION_DROPBOX_KEYS_ENDPOINT: 'http://localhost:2111/dropbox-keys',
    })

  const preAuthToken = tokenService.generateEncryptedToken(
    { key: 'transloadit-key', credentialsName: 'dropbox-creds' },
    'different secret', // COMPANION_PREAUTH_SECRET in mockserver
  )
  const state = oAuthState.encodeState(
    { id: 'test-state', preAuthToken, origin: 'http://localhost:3020' },
    secret,
  )

  const connectWithGateway = async (transloadit_gateway: string) => {
    nock('http://localhost:2111')
      .post('/dropbox-keys')
      .reply(200, {
        credentials: {
          key: 'remote-dropbox-key',
          secret: 'remote-dropbox-secret',
          transloadit_gateway,
        },
      })
    return request(await getDropboxServer()).get(
      `/connect/dropbox?state=${encodeURIComponent(state)}`,
    )
  }

  test.each([
    ['empty', ''],
    ['whitespace-only', '  '],
  ])('a %s gateway is ignored and the OAuth redirect proceeds', async (_, gateway) => {
    const res = await connectWithGateway(gateway)
    expect(res.text).not.toContain('Could not fetch credentials')
    expect(res.status).toBe(302)
    expect(res.headers.location).toContain('dropbox.com')
  })

  test('a configured gateway becomes the redirect_uri host', async () => {
    const res = await connectWithGateway('https://gateway.example.com')
    expect(res.status).toBe(302)
    expect(decodeURIComponent(res.headers.location ?? '')).toContain(
      'redirect_uri=https://gateway.example.com/',
    )
  })

  test('unusable credentials are logged and return 424', async () => {
    const error = vi.spyOn(logger, 'error').mockImplementation(() => {})
    try {
      // invalid gateway makes `new URL(path, gateway)` throw
      const res = await connectWithGateway('not a valid url')
      expect(res.status).toBe(424)
      expect(res.text).toContain('Could not fetch credentials')
      expect(error.mock.calls).toContainEqual([
        'TypeError: Invalid URL',
        'credentials.override.fail',
        undefined,
      ])
    } finally {
      error.mockRestore()
    }
  })

  test('a failing credentials service returns 424 and logs its name and message', async () => {
    const error = vi.spyOn(logger, 'error').mockImplementation(() => {})
    try {
      nock('http://localhost:2111').post('/dropbox-keys').reply(500)
      const res = await request(await getDropboxServer()).get(
        `/connect/dropbox?state=${encodeURIComponent(state)}`,
      )
      expect(res.status).toBe(424)
      expect(error.mock.calls).toContainEqual([
        'HTTPError: Response code 500 (Internal Server Error)',
        'credentials.override.fail',
        undefined,
      ])
    } finally {
      error.mockRestore()
    }
  })

  test("an error of Companion's own returns 500", async () => {
    vi.spyOn(logger, 'error').mockImplementation(() => {})
    const getFromState = vi
      .spyOn(oAuthState, 'getFromState')
      .mockImplementation(() => {
        throw new Error('bug')
      })
    try {
      const res = await request(await getDropboxServer()).get(
        `/connect/dropbox?state=${encodeURIComponent(state)}`,
      )
      expect(res.status).toBe(500)
    } finally {
      getFromState.mockRestore()
      vi.restoreAllMocks()
    }
  })
})
