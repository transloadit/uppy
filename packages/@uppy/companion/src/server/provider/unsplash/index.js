const Provider = require('../Provider')
const adaptData = require('./adapter')
const { withProviderErrorHandling } = require('../providerErrors')
const { prepareStream } = require('../../helpers/utils')
const { ProviderApiError } = require('../error')

const got = require('../../got')

const BASE_URL = 'https://api.unsplash.com'

const getClient = async ({ token }) => (await got).extend({
  prefixUrl: BASE_URL,
  headers: {
    authorization: `Client-ID ${token}`,
  },
})

const getPhotoMeta = async (client, id) => client.get(`photos/${id}`, { responseType: 'json' }).json()

/**
 * Adapter for API https://api.unsplash.com
 */
class Unsplash extends Provider {
  async list ({ token, query = { cursor: null, q: null } }) {
    if (typeof query.q !== 'string') {
      throw new ProviderApiError('Search query missing', 400)
    }

    return this.#withErrorHandling('provider.unsplash.list.error', async () => {
      const qs = { per_page: 40, query: query.q }
      if (query.cursor) qs.page = query.cursor

      const response = await (await getClient({ token })).get('search/photos', { searchParams: qs, responseType: 'json' }).json()
      return adaptData(response, query)
    })
  }

  async download ({ id, token }) {
    return this.#withErrorHandling('provider.unsplash.download.error', async () => {
      const client = await getClient({ token })

      const { links: { download: url, download_location: attributionUrl } } = await getPhotoMeta(client, id)

      const stream = (await got).stream.get(url, { responseType: 'json' })
      const { size } = await prepareStream(stream)

      // To attribute the author of the image, we call the `download_location`
      // endpoint to increment the download count on Unsplash.
      // https://help.unsplash.com/en/articles/2511258-guideline-triggering-a-download
      await client.get(attributionUrl, { prefixUrl: '', responseType: 'json' })

      // finally, stream on!
      return { stream, size }
    })
  }

  // eslint-disable-next-line class-methods-use-this
  async #withErrorHandling (tag, fn) {
    // @ts-ignore
    return withProviderErrorHandling({
      fn,
      tag,
      providerName: 'Unsplash',
      getJsonErrorMessage: (body) => body?.errors && String(body.errors),
    })
  }
}

module.exports = Unsplash
