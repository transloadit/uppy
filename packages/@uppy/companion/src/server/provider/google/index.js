import got from 'got'
import { withGoogleErrorHandling } from '../providerErrors.js'

/**
 * Reusable google stuff
 */

const getOauthClient = () =>
  got.extend({
    prefixUrl: 'https://oauth2.googleapis.com',
  })

export async function refreshToken({
  clientId,
  clientSecret,
  refreshToken: theRefreshToken,
}) {
  return withGoogleErrorHandling(
    'google',
    'provider.google.token.refresh.error',
    async () => {
      const { access_token: accessToken } = await getOauthClient()
        .post('token', {
          responseType: 'json',
          form: {
            refresh_token: theRefreshToken,
            grant_type: 'refresh_token',
            client_id: clientId,
            client_secret: clientSecret,
          },
        })
        .json()
      return { accessToken }
    },
  )
}

export async function logout({ providerUserSession: { accessToken: token } }) {
  return withGoogleErrorHandling(
    'google',
    'provider.google.logout.error',
    async () => {
      await got.post('https://accounts.google.com/o/oauth2/revoke', {
        searchParams: { token },
        responseType: 'json',
      })

      return { revoked: true }
    },
  )
}
