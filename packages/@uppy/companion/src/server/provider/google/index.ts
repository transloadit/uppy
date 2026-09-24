import got from 'got'
import type {
  ProviderLogoutOptions,
  ProviderLogoutResponse,
  ProviderRefreshTokenOptions,
  ProviderRefreshTokenResponse,
} from '../Provider.js'
import { withGoogleErrorHandling } from '../providerErrors.js'

/**
 * Reusable google stuff
 */

export interface GoogleUserSession {
  accessToken: string
}

const getOauthClient = () =>
  got.extend({
    prefixUrl: 'https://oauth2.googleapis.com',
  })

export async function refreshToken({
  clientId,
  clientSecret,
  refreshToken: theRefreshToken,
}: ProviderRefreshTokenOptions): Promise<ProviderRefreshTokenResponse> {
  return withGoogleErrorHandling(
    'google',
    'provider.google.token.refresh.error',
    async () => {
      const tokenRes = await getOauthClient()
        .post('token', {
          responseType: 'json',
          form: {
            refresh_token: theRefreshToken,
            grant_type: 'refresh_token',
            client_id: clientId,
            client_secret: clientSecret,
          },
        })
        .json<{ access_token?: unknown }>()
      const accessToken = tokenRes.access_token
      if (typeof accessToken !== 'string' || accessToken.length === 0) {
        throw new Error('Missing access_token')
      }
      return { accessToken }
    },
  )
}

export async function logout({
  providerUserSession: { accessToken: token },
}: ProviderLogoutOptions<GoogleUserSession>): Promise<ProviderLogoutResponse> {
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
