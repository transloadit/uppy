const got = require('got').default

const Provider = require('../../Provider')
const { getURLMeta } = require('../../../helpers/request')
const logger = require('../../../logger')
const adaptData = require('./adapter')
const { ProviderApiError, ProviderAuthError } = require('../../error')
const { prepareStream } = require('../../../helpers/utils')

const getClient = ({ token }) => got.extend({
  prefixUrl: 'https://graph.instagram.com',
  headers: {
    authorization: `Bearer ${token}`,
  },
})

async function getMediaUrl ({ token, id }) {
  const body = await getClient({ token }).get(String(id), { searchParams: { fields: 'media_url' }, responseType: 'json' }).json()
  return body.media_url
}

/**
 * Adapter for API https://developers.facebook.com/docs/instagram-api/overview
 */
class Instagram extends Provider {
  constructor (options) {
    super(options)
    this.authProvider = Instagram.authProvider
  }

  // for "grant"
  static getExtraConfig () {
    return {
      protocol: 'https',
      scope: ['user_profile', 'user_media'],
    }
  }

  static get authProvider () {
    return 'instagram'
  }

  async list ({ directory, token, query = { cursor: null } }) {
    return this.#withErrorHandling('provider.instagram.list.error', async () => {
      const qs = { fields: 'id,media_type,thumbnail_url,media_url,timestamp,children{media_type,media_url,thumbnail_url,timestamp}' }

      if (query.cursor) qs.after = query.cursor

      const client = getClient({ token })

      const [{ username }, list] = await Promise.all([
        client.get('me', { searchParams: { fields: 'username' }, responseType: 'json' }).json(),
        client.get('me/media', { searchParams: qs, responseType: 'json' }).json(),
      ])
      return adaptData(list, username, directory, query)
    })
  }

  async download ({ id, token }) {
    return this.#withErrorHandling('provider.instagram.download.error', async () => {
      const url = await getMediaUrl({ token, id })
      const stream = got.stream.get(url, { responseType: 'json' })
      await prepareStream(stream)
      return { stream }
    })
  }

  // eslint-disable-next-line class-methods-use-this
  async thumbnail () {
    // not implementing this because a public thumbnail from instagram will be used instead
    logger.error('call to thumbnail is not implemented', 'provider.instagram.thumbnail.error')
    throw new Error('call to thumbnail is not implemented')
  }

  async size ({ id, token }) {
    return this.#withErrorHandling('provider.instagram.size.error', async () => {
      const url = await getMediaUrl({ token, id })
      const { size } = await getURLMeta(url, true)
      return size
    })
  }

  // eslint-disable-next-line class-methods-use-this
  async logout () {
    // access revoke is not supported by Instagram's API
    return { revoked: false, manual_revoke_url: 'https://www.instagram.com/accounts/manage_access/' }
  }

  // todo reuse
  async #withErrorHandling (tag, fn) {
    try {
      return await fn()
    } catch (err) {
      const err2 = this.#convertError(err)
      logger.error(err2, tag)
      throw err2
    }
  }

  #convertError (err) {
    const { response } = err
    if (response) {
      if (response.statusCode === 190) {
        // Invalid OAuth 2.0 Access Token
        return new ProviderAuthError()
      }

      const fallbackMessage = `request to ${this.authProvider} returned ${response.statusCode}`
      let errMsg
      if (typeof response.body === 'object' && response.body.error?.message) errMsg = response.body.error.message
      else if (typeof response.body === 'string') errMsg = response.body
      else errMsg = fallbackMessage

      return new ProviderApiError(errMsg, response.statusCode)
    }

    return err
  }
}

module.exports = Instagram
