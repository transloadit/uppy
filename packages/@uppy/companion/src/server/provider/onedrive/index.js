const got = require('got').default

const Provider = require('../Provider')
const logger = require('../../logger')
const adaptData = require('./adapter')
const { withProviderErrorHandling } = require('../providerErrors')
const { prepareStream } = require('../../helpers/utils')

const getClient = ({ token }) => got.extend({
  prefixUrl: 'https://graph.microsoft.com/v1.0',
  headers: {
    authorization: `Bearer ${token}`,
  },
})

const getRootPath = (query) => (query.driveId ? `drives/${query.driveId}` : 'me/drive')

/**
 * Adapter for API https://docs.microsoft.com/en-us/onedrive/developer/rest-api/
 */
class OneDrive extends Provider {
  constructor (options) {
    super(options)
    this.authProvider = OneDrive.authProvider
  }

  static get authProvider () {
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
      const qs = { $expand: 'thumbnails' }
      if (query.cursor) {
        qs.$skiptoken = query.cursor
      }

      const client = getClient({ token })

      const [{ mail, userPrincipalName }, list] = await Promise.all([
        client.get('me', { responseType: 'json' }).json(),
        client.get(`${getRootPath(query)}/${path}/children`, { searchParams: qs, responseType: 'json' }).json(),
      ])

      return adaptData(list, mail || userPrincipalName)
    })
  }

  async download ({ id, token, query }) {
    return this.#withErrorHandling('provider.onedrive.download.error', async () => {
      const stream = getClient({ token }).stream.get(`${getRootPath(query)}/items/${id}/content`, { responseType: 'json' })
      await prepareStream(stream)
      return { stream }
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
      const { size } = await getClient({ token }).get(`${getRootPath(query)}/items/${id}`, { responseType: 'json' }).json()
      return size
    })
  }

  // eslint-disable-next-line class-methods-use-this
  async logout () {
    return { revoked: false, manual_revoke_url: 'https://account.live.com/consent/Manage' }
  }

  async #withErrorHandling (tag, fn) {
    return withProviderErrorHandling({
      fn,
      tag,
      providerName: this.authProvider,
      isAuthError: (response) => response.statusCode === 401,
      getJsonErrorMessage: (body) => body?.error?.message,
    })
  }
}

module.exports = OneDrive
