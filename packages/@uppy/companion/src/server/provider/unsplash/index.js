const got = require('got').default

const SearchProvider = require('../SearchProvider')
const { getURLMeta } = require('../../helpers/request')
const adaptData = require('./adapter')
const { withProviderErrorHandling } = require('../providerErrors')
const { prepareStream } = require('../../helpers/utils')

const BASE_URL = 'https://api.unsplash.com'

const getClient = ({ token }) => got.extend({
  prefixUrl: BASE_URL,
  headers: {
    authorization: `Client-ID ${token}`,
  },
})

const getPhotoMeta = async (client, id) => client.get(`photos/${id}`, { responseType: 'json' }).json()

/**
 * Adapter for API https://api.unsplash.com
 */
class Unsplash extends SearchProvider {
  async list ({ token, query = { cursor: null, q: null } }) {
    return this.#withErrorHandling('provider.unsplash.list.error', async () => {
      const qs = { per_page: 40, query: query.q }
      if (query.cursor) qs.page = query.cursor

      const response = await getClient({ token }).get('search/photos', { searchParams: qs, responseType: 'json' }).json()
      return adaptData(response, query)
    })
  }

  async download ({ id, token }) {
    return this.#withErrorHandling('provider.unsplash.download.error', async () => {
      const client = getClient({ token })

      const { links: { download: url, download_location: attributionUrl } } = await getPhotoMeta(client, id)

      const stream = got.stream.get(url, { responseType: 'json' })
      await prepareStream(stream)

      // To attribute the author of the image, we call the `download_location`
      // endpoint to increment the download count on Unsplash.
      // https://help.unsplash.com/en/articles/2511258-guideline-triggering-a-download
      await client.get(attributionUrl, { prefixUrl: '', responseType: 'json' })

      // finally, stream on!
      return { stream }
    })
  }

  async size ({ id, token }) {
    return this.#withErrorHandling('provider.unsplash.size.error', async () => {
      const { links: { download: url } } = await getPhotoMeta(getClient({ token }), id)
      const { size } = await getURLMeta(url, true)
      return size
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
