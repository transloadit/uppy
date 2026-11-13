import got from 'got'
import type {
  ProviderRefreshTokenOptions,
  ProviderRefreshTokenResponse,
} from './Provider.js'

/**
 * Exchange a refresh token for a new access token at an OAuth 2.0 token
 * endpoint. `extraForm` carries provider-specific fields (e.g. `redirect_uri`).
 */
export async function refreshAccessToken(
  tokenUrl: string,
  { clientId, clientSecret, refreshToken }: ProviderRefreshTokenOptions,
  extraForm: Record<string, string | undefined> = {},
): Promise<ProviderRefreshTokenResponse> {
  const { access_token: accessToken } = await got
    .post(tokenUrl, {
      // Parse error bodies too, so provider error handling can read them
      // (e.g. Google's `invalid_grant`).
      responseType: 'json',
      form: {
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        ...extraForm,
      },
    })
    .json<{ access_token?: unknown }>()
  if (typeof accessToken !== 'string' || accessToken.length === 0) {
    throw new Error('Missing access_token')
  }
  return { accessToken }
}
