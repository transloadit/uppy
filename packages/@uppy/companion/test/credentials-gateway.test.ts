import nock from 'nock'
import request from 'supertest'
import { afterAll, afterEach, describe, expect, test, vi } from 'vitest'
import * as tokenService from '../dist/server/helpers/jwt.js'
import * as oAuthState from '../dist/server/helpers/oauth-state.js'
import { getServer } from './mockserver.js'

vi.mock('express-prom-bundle')

// Remote credentials fetched for a provider may carry `transloadit_gateway`.
// The Transloadit console stores an unset gateway as an empty string; that must
// be ignored, not fed to `new URL()` (which throws "Invalid URL" and turns the
// login into a "Could not fetch credentials" page).
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
    'secret', // COMPANION_SECRET in mockserver
  )

  const mockCredentials = (transloadit_gateway: string) =>
    nock('http://localhost:2111')
      .post('/dropbox-keys')
      .reply(200, {
        credentials: {
          key: 'remote-dropbox-key',
          secret: 'remote-dropbox-secret',
          transloadit_gateway,
        },
      })

  afterEach(() => nock.cleanAll())
  afterAll(() => nock.restore())

  test('an empty gateway is ignored and the OAuth redirect proceeds', async () => {
    mockCredentials('')
    const res = await request(await getDropboxServer()).get(
      `/connect/dropbox?state=${encodeURIComponent(state)}`,
    )
    expect(res.text).not.toContain('Could not fetch credentials')
    expect(res.status).toBe(302)
    expect(res.headers.location).toContain('dropbox.com')
  })

  test('a configured gateway becomes the redirect_uri host', async () => {
    mockCredentials('https://gateway.example.com')
    const res = await request(await getDropboxServer()).get(
      `/connect/dropbox?state=${encodeURIComponent(state)}`,
    )
    expect(res.status).toBe(302)
    expect(decodeURIComponent(res.headers.location ?? '')).toContain(
      'redirect_uri=https://gateway.example.com/',
    )
  })
})
