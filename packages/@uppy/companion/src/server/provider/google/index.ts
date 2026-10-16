import got from 'got'
import { refreshAccessToken } from '../oauth.js'
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

export async function refreshToken(
  options: ProviderRefreshTokenOptions,
): Promise<ProviderRefreshTokenResponse> {
  return withGoogleErrorHandling(
    'google',
    'provider.google.token.refresh.error',
    () => refreshAccessToken('https://oauth2.googleapis.com/token', options),
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
