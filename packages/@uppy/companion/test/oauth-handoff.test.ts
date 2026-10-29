import type { NextFunction, Request, Response } from 'express'
import request from 'supertest'
import { describe, expect, test, vi } from 'vitest'
import * as tokenService from '../dist/server/helpers/jwt.js'

vi.mock('express-prom-bundle')

const mintedToken = (location: string | undefined) =>
  decodeURIComponent(
    new URL(location ?? '', 'http://x').searchParams.get('uppyAuthToken') ?? '',
  )

describe('OAuth token hand-off', () => {
  test('a callback mints a token only once per OAuth response', async () => {
    const { getServer } = await import('./mockserver.js')
    const agent = request.agent(await getServer())
    await agent.get('/dropbox/callback').expect(302)
    await agent.get('/dropbox/callback').expect(400)
  })

  test('send-token delivers only the token minted in this session, once', async () => {
    const oauthState = await import('../dist/server/helpers/oauth-state.js')
    vi.spyOn(oauthState, 'getFromState').mockImplementation((_state, key) =>
      key === 'authCallbackToken' ? undefined : 'http://localhost:3020',
    )
    const { getServer } = await import('./mockserver.js')
    const agent = request.agent(await getServer())

    const res = await agent.get('/dropbox/callback').expect(302)
    const token = mintedToken(res.header['location'])
    const otherToken = tokenService.generateEncryptedAuthToken(
      { dropbox: { accessToken: 'someone else' } },
      'secret',
    )

    await agent
      .get(
        `/dropbox/send-token?uppyAuthToken=${encodeURIComponent(otherToken)}`,
      )
      .expect(404)
    await agent
      .get(`/dropbox/send-token?uppyAuthToken=${encodeURIComponent(token)}`)
      .expect(200)
    await agent
      .get(`/dropbox/send-token?uppyAuthToken=${encodeURIComponent(token)}`)
      .expect(404)
  })

  test('the OAuth callback refuses responses that are not from a code exchange this session started', async () => {
    const { getServer } = await import('./mockserver.js')
    const server = await getServer()
    await request(server)
      .get('/connect/dropbox/callback?access_token=x')
      .expect(400)
    await request(server)
      .get('/connect/dropbox/callback?error=&access_token=x')
      .expect(400)
    await request(server)
      .post('/connect/dropbox/callback')
      .type('form')
      .send({ access_token: 'x' })
      .expect(400)
    // no OAuth flow was started in this session, so there is no state to check the code against
    await request(server).get('/connect/dropbox/callback?code=x').expect(400)

    // a provider's error reaches the callback, in a session that started a login
    const agent = request.agent(server)
    await agent.get('/connect/dropbox').expect(302)
    const denied = await agent
      .get('/connect/dropbox/callback?error=access_denied')
      .expect(302)
    expect(denied.header['location']).toMatch(/\/dropbox\/callback$/)
  })

  test('the callback saves the session before redirecting to send-token', async () => {
    const callback = (await import('../dist/server/controllers/callback.js'))
      .default
    let saved: (() => void) | undefined
    const req = {
      params: { providerName: 'dropbox' },
      session: {
        grant: { response: { access_token: 'x' } },
        save: (cb: () => void) => {
          saved = cb
        },
      },
      companion: {
        options: { secret: 'secret', server: {} },
        providerClass: { grantDynamicToUserSession: () => ({}) },
        buildURL: (path: string) => `http://localhost${path}`,
      },
      cookies: {},
    } as unknown as Request
    const res = { redirect: vi.fn(), cookie: vi.fn() }
    callback(req, res as unknown as Response)
    expect(req.session.grant?.pendingAuthToken).toBeTruthy()
    expect(res.redirect).not.toHaveBeenCalled()
    saved?.()
    expect(res.redirect).toHaveBeenCalledOnce()
  })

  test('a callback whose response is an error mints no token', async () => {
    const callback = (await import('../dist/server/controllers/callback.js'))
      .default
    const req = {
      params: { providerName: 'dropbox' },
      session: {
        grant: { response: { error: 'access_denied', access_token: 'x' } },
      },
      companion: { options: { secret: 'secret' } },
    } as unknown as Request
    const res = { status: vi.fn(() => res), send: vi.fn() }
    callback(req, res as unknown as Response)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(req.session.grant?.response).toBeUndefined()
  })

  test('logout drops the whole OAuth session', async () => {
    const logout = (await import('../dist/server/controllers/logout.js'))
      .default
    const req = {
      session: { grant: { provider: 'dropbox', state: 's', dynamic: {} } },
      companion: {},
    } as unknown as Request
    const res = { json: vi.fn() }
    await logout(req, res as unknown as Response, vi.fn() as NextFunction)
    expect(req.session.grant).toBeUndefined()
  })

  test('the OAuth state keeps non-ASCII text when decoded and re-encoded', async () => {
    const oauthState = await import('../dist/server/helpers/oauth-state.js')
    const state = { id: 'é ü €', origin: 'http://localhost:3020' }
    const once = oauthState.decodeState(
      oauthState.encodeState(state, 'secret'),
      'secret',
    )
    const twice = oauthState.decodeState(
      oauthState.encodeState(once, 'secret'),
      'secret',
    )
    expect(once).toEqual(state)
    expect(twice).toEqual(state)
  })

  test('connect keeps only an authCallbackToken the auth callback socket accepts', async () => {
    const oauthState = await import('../dist/server/helpers/oauth-state.js')
    const { getServer } = await import('./mockserver.js')
    const server = await getServer()
    const connect = async (authCallbackToken: string) => {
      const res = await request(server)
        .get('/dropbox/connect')
        .query({ authCallbackToken })
        .expect(302)
      const location = new URL(res.header['location'] ?? '')
      return oauthState.decodeState(
        location.searchParams.get('state') ?? '',
        'secret',
      ).authCallbackToken
    }

    const uuid = crypto.randomUUID()
    expect(await connect(uuid)).toBe(uuid)
    expect(await connect('not-a-uuid')).toBeUndefined()
    expect(await connect('é'.repeat(100))).toBeUndefined()
  })
})
