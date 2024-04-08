const got = require('got').default

const Provider = require('../Provider')

const { withProviderErrorHandling } = require('../providerErrors')


const getOauthClient = () => got.extend({
  prefixUrl: 'https://oauth2.googleapis.com',
})

/**
 * Reusable google stuff
 */
class Google extends Provider {
  async refreshToken ({ clientId, clientSecret, refreshToken }) {
    return this.#withErrorHandling('provider.google.token.refresh.error', async () => {
      const { access_token: accessToken } = await getOauthClient().post('token', { responseType: 'json', form: { refresh_token: refreshToken, grant_type: 'refresh_token', client_id: clientId, client_secret: clientSecret } }).json()
      return { accessToken }
    })
  }

  logout ({ token }) {
    return this.#withErrorHandling('provider.google.logout.error', async () => {
      await got.post('https://accounts.google.com/o/oauth2/revoke', {
        searchParams: { token },
        responseType: 'json',
      })

      return { revoked: true }
    })
  }

    // eslint-disable-next-line class-methods-use-this
    async #withErrorHandling (tag, fn) {
      return withProviderErrorHandling({
        fn,
        tag,
        providerName: 'google',
        isAuthError: (response) => (
          response.statusCode === 401
          || (response.statusCode === 400 && response.body?.error === 'invalid_grant') // Refresh token has expired or been revoked
        ),
        getJsonErrorMessage: (body) => body?.error?.message,
      })
    }  
}

module.exports = Google
