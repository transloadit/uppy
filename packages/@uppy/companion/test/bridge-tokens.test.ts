import request from 'supertest'
import { describe, expect, test, vi } from 'vitest'
import * as tokenService from '../src/server/helpers/jwt.js'
import { getServer } from './mockserver.js'

// getServer is called once per test; without this the prom-client metric
// registered inside the metrics middleware collides on the second server.
vi.mock('express-prom-bundle')

// Matches COMPANION_SECRET in test/mockserver.ts defaultEnv.
const secret = 'secret'

const enabledEnv = { COMPANION_ENABLE_DROPBOX_TOKENS_ENDPOINT: 'true' }
const disabledEnv = { COMPANION_ENABLE_DROPBOX_TOKENS_ENDPOINT: 'false' }

describe('GET /:providerName/bridge-tokens', () => {
  test('returns the dropbox tokens, marked no-store, for a valid token', async () => {
    const token = tokenService.generateEncryptedAuthToken(
      { dropbox: { accessToken: 'acc-123', refreshToken: 'ref-456' } },
      secret,
    )
    return request(await getServer(enabledEnv))
      .get('/dropbox/bridge-tokens')
      .set('uppy-auth-token', token)
      .expect('Cache-Control', 'no-store')
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({
          accessToken: 'acc-123',
          refreshToken: 'ref-456',
        })
      })
  })

  test('responds 404 when the Dropbox session has no access token', async () => {
    // The auth token decrypts fine, but holds no usable Dropbox access token.
    const token = tokenService.generateEncryptedAuthToken(
      { dropbox: {} },
      secret,
    )
    return request(await getServer(enabledEnv))
      .get('/dropbox/bridge-tokens')
      .set('uppy-auth-token', token)
      .expect(404)
  })

  test('rejects non-dropbox providers with 400', async () => {
    const token = tokenService.generateEncryptedAuthToken(
      { drive: { accessToken: 'acc-123' } },
      secret,
    )
    return request(await getServer(enabledEnv))
      .get('/drive/bridge-tokens')
      .set('uppy-auth-token', token)
      .expect(400)
  })

  test('responds 401 when no auth token is provided', async () => {
    return request(await getServer(enabledEnv))
      .get('/dropbox/bridge-tokens')
      .expect(401)
  })

  test('responds 404 when the option is disabled', async () => {
    return request(await getServer(disabledEnv))
      .get('/dropbox/bridge-tokens')
      .set('uppy-auth-token', 'whatever')
      .expect(404)
  })
})
