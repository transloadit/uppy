import request from 'supertest'
import { describe, expect, test, vi } from 'vitest'
import * as tokenService from '../src/server/helpers/jwt.js'
import mockOauthState from './mockoauthstate.js'
import { getServer, grantToken } from './mockserver.js'

vi.mock('express-prom-bundle')
mockOauthState()

const secret = 'secret'

describe('test authentication callback', () => {
  test('authentication callback redirects to send-token url', async () => {
    return request(await getServer())
      .get('/drive/callback')
      .expect(302)
      .expect((res) => {
        expect(res.header.location).toContain(
          'http://localhost:3020/drive/send-token?uppyAuthToken=',
        )
      })
  })

  test('authentication callback sets cookie', async () => {
    return request(await getServer())
      .get('/dropbox/callback')
      .expect(302)
      .expect((res) => {
        expect(res.header.location).toContain(
          'http://localhost:3020/dropbox/send-token?uppyAuthToken=',
        )
        const authToken = decodeURIComponent(
          res.header['set-cookie'][0]
            .split(';')[0]
            .split('uppyAuthToken--dropbox=')[1],
        )
        const payload = tokenService.verifyEncryptedAuthToken(
          authToken,
          secret,
          'dropbox',
        )
        expect(payload).toEqual({ dropbox: { accessToken: grantToken } })
      })
  })

  test('the token gets sent via html', async () => {
    const authData = {
      dropbox: { accessToken: 'token value' },
      drive: { accessToken: 'token value' },
    }
    const token = tokenService.generateEncryptedAuthToken(authData, secret)

    // see mock ../../src/server/helpers/oauth-state above for state values
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
