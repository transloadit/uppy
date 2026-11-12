import { createServer, request as httpRequest } from 'node:http'
import { gzipSync } from 'node:zlib'
import express from 'express'
import session from 'express-session'
import nock from 'nock'
import request from 'supertest'
import { afterEach, describe, expect, onTestFinished, test, vi } from 'vitest'
import { app as companionApp } from '../dist/companion.js'
import {
  generateEncryptedAuthToken,
  generateEncryptedToken,
} from '../dist/server/helpers/jwt.js'
import { encodeState } from '../dist/server/helpers/oauth-state.js'
import Provider from '../dist/server/provider/Provider.js'
import standalone from '../dist/standalone/index.js'
import type { CompanionInitOptions } from '../src/schemas/companion.js'
import { setDefaultEnv } from './mockserver.js'

vi.mock('express-prom-bundle')
afterEach(() => {
  nock.cleanAll()
  vi.unstubAllEnvs()
})

const tenantA = 'http://tenant-a.test'
const tenantB = 'http://tenant-b.test'
const secret = 'test-secret'

class LegacyProvider extends Provider {
  static override get oauthProvider() {
    return 'legacy'
  }
}

function embedded(options: Partial<CompanionInitOptions> = {}) {
  const app = express()
  // Deliberately parse first, as in an embedding application.
  app.use(express.json())
  app.use(session({ secret, resave: false, saveUninitialized: false }))
  app.post('/seed/:origin', (req, res) => {
    req.session.grant = {
      provider: 'dropbox',
      state: 'csrf-state',
      dynamic: {
        state: encodeState(
          { id: 'flow', origin: req.params['origin'] },
          secret,
        ),
      },
      response: { access_token: 'own-access-token' },
    }
    res.end()
  })
  app.use(
    companionApp({
      secret,
      preAuthSecret: 'preauth',
      filePath: './test/output',
      metrics: false,
      server: { protocol: 'http', host: 'localhost:3020' },
      providerOptions: {
        dropbox: { key: 'trusted-key', secret: 'trusted-secret' },
      },
      corsOrigins: [tenantA, tenantB],
      ...options,
    }).app,
  )
  return app
}

describe('OAuth request boundaries', () => {
  test('rejects an encoded body already inflated by the host parser', async () => {
    const server = createServer(embedded())
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    onTestFinished(() => {
      server.closeAllConnections()
      server.close()
    })
    const address = server.address()
    if (!address || typeof address === 'string')
      throw new Error('Expected TCP server')
    const body = gzipSync(JSON.stringify({ state: 'a'.repeat(7000) }))
    const status = await new Promise<number | undefined>((resolve, reject) => {
      const req = httpRequest(
        {
          hostname: '127.0.0.1',
          port: address.port,
          path: '/connect/dropbox',
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'content-encoding': 'gzip',
            'content-length': body.length,
          },
        },
        (res) => {
          res.resume()
          resolve(res.statusCode)
        },
      )
      req.on('error', reject)
      req.end(body)
    })
    expect(status).toBe(415)
  })

  test('rejects unknown, nested and excessive Grant input before it reaches the session', async () => {
    const app = embedded()
    await request(app)
      .post('/connect/dropbox')
      .send({ payload: 'unused' })
      .expect(400)
    await request(app)
      .post('/connect/dropbox')
      .send({ state: { nested: 'value' } })
      .expect(400)
    await request(app)
      .post('/connect/dropbox')
      .send({ state: 'a'.repeat(8193) })
      .expect(413)
    await request(app)
      .get('/connect/dropbox')
      .query({ state: 'a'.repeat(8193) })
      .expect(413)
    await request(app).get('/connect/unknown').expect(400)
    await request(app).get('/connect/dropbox').expect(302)
  })

  test('uses the pending provider rather than an OAuth 1 URL exemption', async () => {
    const app = embedded({
      customProviders: {
        legacy: { module: LegacyProvider, config: { oauth: 1 } },
      },
    })
    const agent = request.agent(app)
    await agent.post(`/seed/${encodeURIComponent(tenantA)}`).expect(200)
    await agent
      .get('/connect/legacy/callback?access_token=attacker')
      .expect(400)
  })

  test('a fetch from another allowed tenant cannot consume the callback or send-token', async () => {
    const agent = request.agent(embedded())
    await agent.post(`/seed/${encodeURIComponent(tenantA)}`).expect(200)
    await agent
      .get('/dropbox/callback')
      .set('Origin', tenantB)
      .set('Sec-Fetch-Mode', 'cors')
      .expect(403)
    const callback = await agent
      .get('/dropbox/callback')
      .set('Sec-Fetch-Mode', 'navigate')
      .expect(302)
    const location = new URL(callback.get('location') ?? '')
    const target = `${location.pathname}${location.search}`
    await agent.get(target).set('Origin', tenantB).expect(403)
    const handoff = await agent
      .get(target)
      .set('Sec-Fetch-Mode', 'navigate')
      .expect(200)
    expect(handoff.text).toContain('tenant-a.test')
    await agent
      .get('/dropbox/thumbnail/file')
      .set('Origin', tenantB)
      .expect(403)
  })

  test('rechecks the current allowlist before handing off a saved origin', async () => {
    const agent = request.agent(embedded({ corsOrigins: [tenantA] }))
    await agent.post(`/seed/${encodeURIComponent(tenantB)}`).expect(200)
    const callback = await agent.get('/dropbox/callback').expect(302)
    const location = new URL(callback.get('location') ?? '')
    await agent.get(`${location.pathname}${location.search}`).expect(403)
  })

  test('refresh and logout do not take an auth token from the query string', async () => {
    const app = embedded()
    const token = generateEncryptedAuthToken(
      { dropbox: { accessToken: 'own-token' } },
      secret,
    )
    await request(app)
      .post('/dropbox/refresh-token')
      .query({ uppyAuthToken: token })
      .expect(401)
    const logout = await request(app)
      .get('/dropbox/logout')
      .query({ uppyAuthToken: token })
      .expect(200)
    expect(logout.body).toEqual({ ok: true, revoked: false })
    expect(logout.header['set-cookie']).toBeUndefined()
  })

  test('uses fetched app keys and refuses query overrides', async () => {
    const app = embedded({
      providerOptions: { dropbox: { credentialsURL: 'http://keys.test/keys' } },
    })
    const state = encodeState(
      {
        id: 'flow',
        preAuthToken: generateEncryptedToken({ workspace: 'own' }, 'preauth'),
      },
      secret,
    )
    await request(app)
      .get('/connect/dropbox')
      .query({ state, key: 'attacker' })
      .expect(400)
    const endpoint = nock('http://keys.test')
      .post('/keys')
      .reply(200, {
        credentials: { key: 'fetched-key', secret: 'fetched-secret' },
      })
    const response = await request(app)
      .get('/connect/dropbox')
      .query({ state })
      .expect(302)
    expect(
      new URL(response.get('location') ?? '').searchParams.get('client_id'),
    ).toBe('fetched-key')
    expect(endpoint.isDone()).toBe(true)
  })

  test('uses a secure host-only session cookie on HTTPS, with no anonymous health sessions', async () => {
    setDefaultEnv()
    vi.stubEnv('COMPANION_PROTOCOL', 'https')
    vi.stubEnv('COMPANION_COOKIE_DOMAIN', '.example.test')
    const { app } = standalone({
      secret,
      filePath: './test/output',
      server: { host: 'localhost:3020', protocol: 'https' },
    })
    const health = await request(app).get('/health').expect(200)
    expect(health.header['set-cookie']).toBeUndefined()
    const login = await request(app)
      .get('/connect/dropbox')
      .set('X-Forwarded-Proto', 'https')
      .expect(302)
    const cookies = login.header['set-cookie']
    expect(cookies).toEqual([expect.stringContaining('__Host-companion.sid=')])
    if (!cookies?.[0]) throw new Error('Expected session cookie')
    expect(cookies[0]).toContain('Path=/')
    expect(cookies[0]).toContain('Secure')
    expect(cookies[0]).toContain('SameSite=Lax')
    expect(cookies[0]).not.toContain('Domain=')
  })
})
