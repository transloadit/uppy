const mockOauthState = require('../mockoauthstate')()

// eslint-disable-next-line import/order
const request = require('supertest')
const tokenService = require('../../src/server/helpers/jwt')
const { getServer, grantToken } = require('../mockserver')

jest.mock('../../src/server/helpers/oauth-state', () => ({
  ...jest.requireActual('../../src/server/helpers/oauth-state'),
  ...mockOauthState,
}))

const authServer = getServer()
const authData = {
  dropbox: { accessToken: 'token value' },
  drive: { accessToken: 'token value' },
}
const token = tokenService.generateEncryptedAuthToken(authData, process.env.COMPANION_SECRET)

describe('test authentication callback', () => {
  test('authentication callback redirects to send-token url', () => {
    return request(authServer)
      .get('/drive/callback')
      .expect(302)
      .expect((res) => {
        expect(res.header.location).toContain('http://localhost:3020/drive/send-token?uppyAuthToken=')
      })
  })

  test('authentication callback sets cookie', () => {
    console.log(process.env.COMPANION_SECRET)
    return request(authServer)
      .get('/dropbox/callback')
      .expect(302)
      .expect((res) => {
        expect(res.header.location).toContain('http://localhost:3020/dropbox/send-token?uppyAuthToken=')
        const authToken = decodeURIComponent(res.header['set-cookie'][0].split(';')[0].split('uppyAuthToken--dropbox=')[1])
        const payload = tokenService.verifyEncryptedAuthToken(authToken, process.env.COMPANION_SECRET, 'dropbox')
        expect(payload).toEqual({ dropbox: { accessToken: grantToken } })
      })
  })

  test('the token gets sent via html', () => {
    // see mock ../../src/server/helpers/oauth-state above for state values
    return request(authServer)
      .get(`/dropbox/send-token?uppyAuthToken=${token}&state=state-with-newer-version`)
      .expect(200)
      .expect((res) => {
        const body = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <script>
          window.opener.postMessage({"token":"${token}"}, "http:\\u002F\\u002Flocalhost:3020")
          window.close()
        </script>
    </head>
    <body></body>
    </html>`
        expect(res.text).toBe(body)
      })
  })
})
