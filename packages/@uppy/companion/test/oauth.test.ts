import nock from 'nock'
import { afterEach, expect, test } from 'vitest'
import { ProviderAuthError } from '../src/server/provider/error.js'
import { refreshToken as refreshGoogleToken } from '../src/server/provider/google/index.js'
import { refreshAccessToken } from '../src/server/provider/oauth.js'

const options = {
  clientId: 'id',
  clientSecret: 'client-secret',
  refreshToken: 'refresh',
  redirectUri: 'https://companion.test/onedrive/redirect',
}

afterEach(() => {
  nock.cleanAll()
})

test('exchanges a refresh token, with provider-specific form fields', async () => {
  let form: unknown
  nock('https://oauth.test')
    .post('/token', (body) => {
      form = body
      return true
    })
    .reply(200, { access_token: 'new-access' })
  await expect(
    refreshAccessToken('https://oauth.test/token', options, {
      redirect_uri: options.redirectUri,
    }),
  ).resolves.toEqual({ accessToken: 'new-access' })
  expect(form).toEqual({
    refresh_token: 'refresh',
    grant_type: 'refresh_token',
    client_id: 'id',
    client_secret: 'client-secret',
    redirect_uri: options.redirectUri,
  })
})

test('rejects a response without an access token', async () => {
  nock('https://oauth.test').post('/token').reply(200, { access_token: '' })
  await expect(
    refreshAccessToken('https://oauth.test/token', options),
  ).rejects.toThrow('Missing access_token')
})

test('an expired Google refresh token is an auth error', async () => {
  nock('https://oauth2.googleapis.com')
    .post('/token')
    .reply(400, { error: 'invalid_grant' })
  await expect(refreshGoogleToken(options)).rejects.toBeInstanceOf(
    ProviderAuthError,
  )
})
