const Provider = require('../Provider')
const logger = require('../../logger')
const adaptData = require('./adapter')
const { withProviderErrorHandling } = require('../providerErrors')
const { prepareStream } = require('../../helpers/utils')

const got = require('../../got')

const getClient = async ({ token }) => (await got).extend({
  prefixUrl: 'https://graph.microsoft.com/v1.0',
  headers: {
    authorization: `Bearer ${token}`,
  },
})

const getOauthClient = async () => (await got).extend({
  prefixUrl: 'https://login.live.com',
})

const getRootPath = (query) => (query.driveId ? `drives/${query.driveId}` : 'me/drive')

/**
 * Adapter for API https://docs.microsoft.com/en-us/onedrive/developer/rest-api/
 */
class OneDrive extends Provider {
  static get oauthProvider () {
    return 'microsoft'
  }

  /**
   * Makes 2 requests in parallel - 1. to get files, 2. to get user email
   * it then waits till both requests are done before proceeding with the callback
   *
   * @param {object} options
   * @param {string} options.directory
   * @param {any} options.query
   * @param {string} options.token
   */
  async list ({ directory, query, token }) {
    return this.#withErrorHandling('provider.onedrive.list.error', async () => {
      const path = directory ? `items/${directory}` : 'root'
      // https://learn.microsoft.com/en-us/graph/query-parameters?tabs=http#top-parameter
      const pageSize = 999
      // const pageSize = 20 // to test pagination easily
      const qs = { $expand: 'thumbnails', $top: pageSize }
      if (query.cursor) {
        qs.$skiptoken = query.cursor
      }

      const client = await getClient({ token })

      const [{ mail, userPrincipalName }, list] = await Promise.all([
        client.get('me', { responseType: 'json' }).json(),
        client.get(`${getRootPath(query)}/${path}/children`, { searchParams: qs, responseType: 'json' }).json(),
      ])

      return adaptData(list, mail || userPrincipalName, query, directory)
    })
  }

  async download ({ id, token, query }) {
    return this.#withErrorHandling('provider.onedrive.download.error', async () => {
      const stream = (await getClient({ token })).stream.get(`${getRootPath(query)}/items/${id}/content`, { responseType: 'json' })
      const { size } = await prepareStream(stream)
      return { stream, size }
    })
  }

  // eslint-disable-next-line class-methods-use-this
  async thumbnail () {
    // not implementing this because a public thumbnail from onedrive will be used instead
    logger.error('call to thumbnail is not implemented', 'provider.onedrive.thumbnail.error')
    throw new Error('call to thumbnail is not implemented')
  }

  async size ({ id, query, token }) {
    return this.#withErrorHandling('provider.onedrive.size.error', async () => {
      const { size } = await (await getClient({ token })).get(`${getRootPath(query)}/items/${id}`, { responseType: 'json' }).json()
      return size
    })
  }

  // eslint-disable-next-line class-methods-use-this
  async logout () {
    // apparently M$ doesn't support programmatic oauth2 revoke
    return { revoked: false, manual_revoke_url: 'https://account.live.com/consent/Manage' }
  }

  async refreshToken ({ clientId, clientSecret, refreshToken, redirectUri }) {
    return this.#withErrorHandling('provider.onedrive.token.refresh.error', async () => {
      const { access_token: accessToken } = await (await getOauthClient()).post('oauth20_token.srf', { responseType: 'json', form: { refresh_token: refreshToken, grant_type: 'refresh_token', client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri } }).json()
      return { accessToken }
    })
  }

  // eslint-disable-next-line class-methods-use-this
  async #withErrorHandling (tag, fn) {
    return withProviderErrorHandling({
      fn,
      tag,
      providerName: OneDrive.oauthProvider,
      isAuthError: (response) => response.statusCode === 401,
      isUserFacingError: (response) => [400, 403].includes(response.statusCode),
      // onedrive gives some errors here that the user might want to know about
      // e.g. these happen if you try to login to a users in an organization,
      // without an Office365 licence or OneDrive account setup completed
      // 400: Tenant does not have a SPO license
      // 403: You do not have access to create this personal site or you do not have a valid license
      getJsonErrorMessage: (body) => body?.error?.message,
    })
  }
}

module.exports = OneDrive
