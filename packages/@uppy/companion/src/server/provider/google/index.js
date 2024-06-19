const got = require('../../got')


const { withGoogleErrorHandling } = require('../providerErrors')


/**
 * Reusable google stuff
 */

const getOauthClient = async () => (await got).extend({
  prefixUrl: 'https://oauth2.googleapis.com',
})

async function refreshToken({ clientId, clientSecret, refreshToken: theRefreshToken }) {
  return withGoogleErrorHandling('google', 'provider.google.token.refresh.error', async () => {
    const { access_token: accessToken } = await (await getOauthClient()).post('token', { responseType: 'json', form: { refresh_token: theRefreshToken, grant_type: 'refresh_token', client_id: clientId, client_secret: clientSecret } }).json()
    return { accessToken }
  })
}

async function logout({ token }) {
  return withGoogleErrorHandling('google', 'provider.google.logout.error', async () => {
    await (await got).post('https://accounts.google.com/o/oauth2/revoke', {
      searchParams: { token },
      responseType: 'json',
    })

    return { revoked: true }
  })
}

module.exports = {
  refreshToken,
  logout,
}
