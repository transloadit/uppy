import request from 'supertest'
import { afterEach, describe, expect, test, vi } from 'vitest'
import * as tokenService from '../dist/server/helpers/jwt.js'

const secret = 'secret'

vi.mock('express-prom-bundle')

describe('test authentication callback', () => {
  test('authentication callback redirects to send-token url', async () => {
    const { getServer } = await import('./mockserver.js')
    return request(await getServer())
      .get('/drive/callback')
      .expect(302)
      .expect((res) => {
        expect(res.header['location']).toContain(
          'http://localhost:3020/drive/send-token?uppyAuthToken=',
        )
      })
  })

  test('authentication callback sets cookie', async () => {
    const { getServer, grantToken } = await import('./mockserver.js')
    return request(await getServer())
      .get('/dropbox/callback')
      .expect(302)
      .expect((res) => {
        expect(res.header['location']).toContain(
          'http://localhost:3020/dropbox/send-token?uppyAuthToken=',
        )
        const setCookie = res.header['set-cookie']
        if (!Array.isArray(setCookie) || !setCookie[0]) {
          throw new Error('Missing set-cookie header')
        }
        const authToken = decodeURIComponent(
          setCookie[0].split(';')[0].split('uppyAuthToken--dropbox=')[1],
        )
        const payload = tokenService.verifyEncryptedAuthToken(
          authToken,
          secret,
          'dropbox',
        )
        expect(payload).toEqual({ dropbox: { accessToken: grantToken } })
      })
  })

  test('the token gets sent via websocket', async () => {
    const callbackToken = 'auth-callback-token'

    const oauthState = await import('../dist/server/helpers/oauth-state.js')
    vi.spyOn(oauthState, 'getFromState').mockImplementation((_state, key) => {
      if (key === 'authCallbackToken') return callbackToken

      return 'http://localhost:3020'
    })

    const authData = {
      dropbox: { accessToken: 'token value' },
      drive: { accessToken: 'token value' },
    }
    const token = tokenService.generateEncryptedAuthToken(authData, secret)

    const emitted = Promise.withResolvers<unknown>()

    const { getServerWithEmitter } = await import('./mockserver.js')
    const { server, emitter } = await getServerWithEmitter()
    // Older socket workers forward only the first argument of a publication.
    await emitter.on(callbackToken, (data) => emitted.resolve(data))

    await request(server)
      .get(`/dropbox/send-token?uppyAuthToken=${encodeURIComponent(token)}`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toMatch('Authentication successful')
      })

    expect(await emitted.promise).toEqual({ token })
  })

  test('the token gets sent via legacy html mechanism', async () => {
    const oauthState = await import('../dist/server/helpers/oauth-state.js')
    vi.spyOn(oauthState, 'getFromState').mockImplementation((_state, key) => {
      if (key === 'authCallbackToken') return undefined

      return 'http://localhost:3020'
    })

    const authData = {
      dropbox: { accessToken: 'token value' },
      drive: { accessToken: 'token value' },
    }
    const token = tokenService.generateEncryptedAuthToken(authData, secret)

    const { getServer } = await import('./mockserver.js')
    // see mock ../../dist/server/helpers/oauth-state above for state values
    return request(await getServer())
      .get(`/dropbox/send-token?uppyAuthToken=${encodeURIComponent(token)}`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toMatch(`var data = {"token":"${token}"};`)
        expect(res.text).toMatch(
          `var origin = "http:\\u002F\\u002Flocalhost:3020";`,
        )
      })
  })
})

describe('legacy html mechanism target origin', () => {
  afterEach(() => {
    delete process.env['COMPANION_CLIENT_ORIGINS_REGEX']
  })

  test('the token is posted only to a state origin that is an origin', async () => {
    // the spies above are not restored
    vi.restoreAllMocks()
    const token = tokenService.generateEncryptedAuthToken(
      { dropbox: { accessToken: 'token value' } },
      secret,
    )
    const { getServer } = await import('./mockserver.js')
    const server = await getServer({
      COMPANION_CLIENT_ORIGINS: undefined,
      COMPANION_CLIENT_ORIGINS_REGEX: '^http://.*localhost:3020/?$',
    })
    const sendToken = async (origin: string) => {
      const connect = await request(server)
        .get('/dropbox/connect')
        .query({ state: btoa(JSON.stringify({ origin })) })
        .expect(302)
      const state = new URL(connect.header['location'] ?? '').searchParams.get(
        'state',
      )
      return request(server)
        .get('/dropbox/send-token')
        .query({ uppyAuthToken: token, state })
    }

    const res = await sendToken('http://localhost:3020')
    expect(res.status).toBe(200)
    expect(res.text).toMatch(
      `var origin = "http:\\u002F\\u002Flocalhost:3020";`,
    )
    // a trailing slash is still just the origin
    const slash = await sendToken('http://localhost:3020/')
    expect(slash.status).toBe(200)
    expect(slash.text).toMatch(
      `var origin = "http:\\u002F\\u002Flocalhost:3020";`,
    )
    // these match the RegExp, but postMessage() would deliver them to http://example.com
    for (const origin of [
      'http://example.com/.localhost:3020',
      'http://example.com#.localhost:3020',
      'http://example.com\\.localhost:3020',
      'http://example.com?.localhost:3020',
    ]) {
      expect((await sendToken(origin)).status).toBe(404)
    }
  })
})
