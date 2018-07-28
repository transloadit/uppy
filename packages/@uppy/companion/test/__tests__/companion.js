/* global jest:false, test:false, expect:false, describe:false */

jest.mock('tus-js-client')
jest.mock('purest')
jest.mock('../../src/server/helpers/oauth-state', () => {
  return {
    generateState: () => 'some-cool-nice-encrytpion',
    addToState: () => 'some-cool-nice-encrytpion',
    getFromState: (state) => {
      return state === 'state-with-invalid-instance-url' ? 'http://localhost:3452' : 'http://localhost:3020'
    }
  }
})

const request = require('supertest')
const tokenService = require('../../src/server/helpers/jwt')
const { authServer, noAuthServer } = require('../mockserver')
const authData = {
  dropbox: 'token value',
  drive: 'token value'
}
const token = tokenService.generateToken(authData, process.env.UPPYSERVER_SECRET)
const OAUTH_STATE = 'some-cool-nice-encrytpion'

describe('set i-am header', () => {
  test('set i-am header in response', () => {
    return request(authServer)
      .get('/dropbox/list/')
      .set('uppy-auth-token', token)
      .expect(200)
      .then((res) => expect(res.header['i-am']).toBe('http://localhost:3020'))
  })
})

describe('list provider files', () => {
  test('list files for dropbox', () => {
    return request(authServer)
      .get('/dropbox/list/')
      .set('uppy-auth-token', token)
      .expect(200)
      .then((res) => expect(res.body.hash).toBe('0a9f95a989dd4b1851f0103c31e304ce'))
  })

  test('list files for google drive', () => {
    return request(authServer)
      .get('/drive/list/')
      .set('uppy-auth-token', token)
      .expect(200)
      .then((res) => expect(res.body.etag).toBe('"bcIyJ9A3gXa8oTYmz6nzAjQd-lY/eQc3WbZHkXpcItNyGKDuKXM_bNY"'))
  })
})

describe('download provdier file', () => {
  test('specified file gets downloaded from provider', () => {
    return request(authServer)
      .post('/drive/get/README.md')
      .set('uppy-auth-token', token)
      .set('Content-Type', 'application/json')
      .send({
        endpoint: 'http://master.tus.com/files',
        protocol: 'tus'
      })
      .expect(200)
      .then((res) => expect(res.body.token).toBeTruthy())
  })
})

describe('test authentication', () => {
  test('authentication callback redirects to specified url', () => {
    return request(authServer)
      .get('/drive/callback')
      .set('uppy-auth-token', token)
      .expect(200)
      .expect((res) => {
        const authToken = res.header['set-cookie'][0].split(';')[0].split('uppyAuthToken=')[1]
        // see mock ../../src/server/helpers/oauth-state above for http://localhost:3020
        const body = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8" />
            <script>
              window.opener.postMessage({token: "${authToken}"}, "http://localhost:3020")
              window.close()
            </script>
        </head>
        <body></body>
        </html>`
        expect(res.text).toBe(body)
      })
  })

  test('check for authenticated provider', () => {
    request(authServer)
      .get('/drive/authorized/')
      .set('uppy-auth-token', token)
      .expect(200)
      .then((res) => expect(res.body.authenticated).toBe(true))

    request(noAuthServer)
      .get('/drive/authorized/')
      .expect(200)
      .then((res) => expect(res.body.authenticated).toBe(false))
  })

  test('logout provider', () => {
    return request(authServer)
      .get('/drive/logout/')
      .set('uppy-auth-token', token)
      .expect(200)
      .then((res) => expect(res.body.ok).toBe(true))
  })
})

describe('connect to provider', () => {
  test('connect to dropbox via grant.js endpoint', () => {
    return request(authServer)
      .get('/dropbox/connect?foo=bar')
      .set('uppy-auth-token', token)
      .expect(302)
      .expect('Location', `http://localhost:3020/connect/dropbox?state=${OAUTH_STATE}`)
  })

  test('connect to drive via grant.js endpoint', () => {
    return request(authServer)
      .get('/drive/connect?foo=bar')
      .set('uppy-auth-token', token)
      .expect(302)
      .expect('Location', `http://localhost:3020/connect/google?state=${OAUTH_STATE}`)
  })
})

describe('handle oauth redirect', () => {
  test('redirect to a valid uppy instance', () => {
    return request(authServer)
      .get(`/dropbox/redirect?state=${OAUTH_STATE}`)
      .set('uppy-auth-token', token)
      .expect(302)
      .expect('Location', `http://localhost:3020/connect/dropbox/callback?state=${OAUTH_STATE}`)
  })

  test('do not redirect to invalid uppy instances', () => {
    const state = 'state-with-invalid-instance-url' // see mock ../../src/server/helpers/oauth-state above
    return request(authServer)
      .get(`/dropbox/redirect?state=${state}`)
      .set('uppy-auth-token', token)
      .expect(400)
  })
})
