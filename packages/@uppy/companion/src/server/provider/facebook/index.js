const got = require('got').default

const Provider = require('../Provider')
const { getURLMeta } = require('../../helpers/request')
const logger = require('../../logger')
const { adaptData, sortImages } = require('./adapter')
const { withProviderErrorHandling } = require('../providerErrors')
const { prepareStream } = require('../../helpers/utils')

const getClient = ({ token }) => got.extend({
  prefixUrl: 'https://graph.facebook.com',
  headers: {
    authorization: `Bearer ${token}`,
  },
})

async function getMediaUrl ({ token, id }) {
  const body = await getClient({ token }).get(String(id), { searchParams: { fields: 'images' }, responseType: 'json' }).json()
  const sortedImages = sortImages(body.images)
  return sortedImages[sortedImages.length - 1].source
}

/**
 * Adapter for API https://developers.facebook.com/docs/graph-api/using-graph-api/
 */
class Facebook extends Provider {
  constructor (options) {
    super(options)
    this.authProvider = Facebook.authProvider
  }

  static get authProvider () {
    return 'facebook'
  }

  async list ({ directory, token, query = { cursor: null } }) {
    return this.#withErrorHandling('provider.facebook.list.error', async () => {
      const qs = { fields: 'name,cover_photo,created_time,type' }

      if (query.cursor) qs.after = query.cursor

      let path = 'me/albums'
      if (directory) {
        path = `${directory}/photos`
        qs.fields = 'icon,images,name,width,height,created_time'
      }

      const client = getClient({ token })

      const [{ email }, list] = await Promise.all([
        client.get('me', { searchParams: { fields: 'email' }, responseType: 'json' }).json(),
        client.get(path, { searchParams: qs, responseType: 'json' }).json(),
      ])
      return adaptData(list, email, directory, query)
    })
  }

  async download ({ id, token }) {
    return this.#withErrorHandling('provider.facebook.download.error', async () => {
      const url = await getMediaUrl({ token, id })
      const stream = got.stream.get(url, { responseType: 'json' })
      await prepareStream(stream)
      return { stream }
    })
  }

  // eslint-disable-next-line class-methods-use-this
  async thumbnail () {
    // not implementing this because a public thumbnail from facebook will be used instead
    logger.error('call to thumbnail is not implemented', 'provider.facebook.thumbnail.error')
    throw new Error('call to thumbnail is not implemented')
  }

  async size ({ id, token }) {
    return this.#withErrorHandling('provider.facebook.size.error', async () => {
      const url = await getMediaUrl({ token, id })
      const { size } = await getURLMeta(url, true)
      return size
    })
  }

  async logout ({ token }) {
    return this.#withErrorHandling('provider.facebook.logout.error', async () => {
      await getClient({ token }).delete('me/permissions', { responseType: 'json' }).json()
      return { revoked: true }
    })
  }

  async #withErrorHandling (tag, fn) {
    return withProviderErrorHandling({
      fn,
      tag,
      providerName: this.authProvider,
      isAuthError: (response) => response.statusCode === 190, // Invalid OAuth 2.0 Access Token
      getJsonErrorMessage: (body) => body?.error?.message,
    })
  }
}

module.exports = Facebook
