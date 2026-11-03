import request from 'supertest'
import { describe, expect, test, vi } from 'vitest'
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
