import express from 'express'
import session from 'express-session'
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
})

describe('credentials endpoint failures', () => {
  const zoomCredentialsParams = Buffer.from(
    JSON.stringify({ params: 'ZOOM-CREDENTIALS-PARAMS' }),
  ).toString('base64')

  test('the endpoint error body is not passed on to the client', async () => {
    nock('http://localhost:2111')
      .post('/zoom-keys')
      .reply(500, 'Traceback: internal detail')
    const res = await request(await getZoomServer())
      .post('/zoom/deauthorization/callback')
      .set('Content-Type', 'application/json')
      .set('Authorization', 'any')
      .set('uppy-credentials-params', zoomCredentialsParams)
      .send({ event: 'app_deauthorized', payload: {} })
    expect(res.status).toBe(502)
    expect(res.text).not.toContain('internal detail')
    expect(res.body).toEqual({
      message: 'HTTP 500: Could not fetch credentials',
    })
  })

  test('the endpoint URL is not passed on to the client', async () => {
    nock('http://localhost:2111').post('/zoom-keys').reply(200, 'not json')
    const res = await request(await getZoomServer())
      .post('/zoom/deauthorization/callback')
      .set('Content-Type', 'application/json')
      .set('Authorization', 'any')
      .set('uppy-credentials-params', zoomCredentialsParams)
      .send({ event: 'app_deauthorized', payload: {} })
    expect(res.status).toBe(500)
    expect(res.text).not.toContain('localhost:2111')
  })
})

describe('credentials endpoint origins', () => {
  const preAuthToken = tokenService.generateEncryptedToken(
    { key: 'transloadit-key', credentialsName: 'dropbox-creds' },
    'different secret', // COMPANION_PREAUTH_SECRET in mockserver
  )
  const sessionState = oAuthState.encodeState(
    { id: 'session-state', preAuthToken },
    secret,
  )

  // A session whose OAuth flow has finished, and a way to read it back.
  const getSessionServer = async () => {
    const app = express()
    app.use(session({ secret: 'grant', resave: true, saveUninitialized: true }))
    app.get('/seed', (req, res) => {
      req.session.grant = {
        state: 'grant-state',
        dynamic: { state: sessionState },
        response: { access_token: 'session token' },
      }
      res.end()
    })
    app.get('/grant', (req, res) => {
      res.json(req.session.grant)
    })
    app.use(
      await getServer({
        COMPANION_DROPBOX_KEYS_ENDPOINT: 'http://localhost:2111/dropbox-keys',
      }),
    )
    const agent = request.agent(app)
    await agent.get('/seed').expect(200)
    return agent
  }

  beforeEach(() => {
    nock('http://localhost:2111')
      .post('/dropbox-keys')
      .reply(200, {
        credentials: {
          key: 'remote-dropbox-key',
          secret: 'remote-dropbox-secret',
          origins: ['http://localhost:3020'],
        },
      })
  })

  test('a connect request Grant does not handle leaves the session state alone', async () => {
    const agent = await getSessionServer()
    const clientState = oAuthState.encodeState(
      { id: 'client-state', preAuthToken },
      secret,
    )
    // Grant does not match this URL, only the credentials middleware does
    await agent
      .get(`/connect/dropbox//?state=${encodeURIComponent(clientState)}`)
      .expect(404)

    const { body } = await agent.get('/grant').expect(200)
    expect(body.response).toEqual({ access_token: 'session token' })
    expect(body.dynamic.state).toBe(sessionState)
  })

  test('the origins are added to the session state on the OAuth callback', async () => {
    const agent = await getSessionServer()
    await agent.get('/connect/dropbox/callback?error=access_denied').expect(302)

    const { body } = await agent.get('/grant').expect(200)
    expect(oAuthState.decodeState(body.dynamic.state, secret)).toEqual({
      id: 'session-state',
      preAuthToken,
      customerDefinedAllowedOrigins: ['http://localhost:3020'],
    })
  })
})
