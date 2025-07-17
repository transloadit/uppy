import got from 'got'
import { prepareStream } from '../../helpers/utils.js'
import { ProviderApiError } from '../error.js'
import Provider from '../Provider.js'
import { withProviderErrorHandling } from '../providerErrors.js'
import adaptData from './adapter.js'

const BASE_URL = 'https://api.unsplash.com'

const getClient = ({ token }) =>
  got.extend({
    prefixUrl: BASE_URL,
    headers: {
      authorization: `Client-ID ${token}`,
    },
  })

const getPhotoMeta = async (client, id) =>
  client.get(`photos/${id}`, { responseType: 'json' }).json()

/**
 * Adapter for API https://api.unsplash.com
 */
export default class Unsplash extends Provider {
  async list({
    providerUserSession: { accessToken: token },
    query = { cursor: null, q: null },
  }) {
    if (typeof query.q !== 'string') {
      throw new ProviderApiError('Search query missing', 400)
    }

    return this.#withErrorHandling('provider.unsplash.list.error', async () => {
      const qs = { per_page: 40, query: query.q }
      if (query.cursor) qs.page = query.cursor

      const response = await getClient({ token })
        .get('search/photos', { searchParams: qs, responseType: 'json' })
        .json()
      return adaptData(response, query)
    })
  }

  async download({ id, providerUserSession: { accessToken: token } }) {
    return this.#withErrorHandling(
      'provider.unsplash.download.error',
      async () => {
        const client = getClient({ token })

        const {
          links: { download: url, download_location: attributionUrl },
        } = await getPhotoMeta(client, id)

        const stream = got.stream.get(url, { responseType: 'json' })
        const { size } = await prepareStream(stream)

        // To attribute the author of the image, we call the `download_location`
        // endpoint to increment the download count on Unsplash.
        // https://help.unsplash.com/en/articles/2511258-guideline-triggering-a-download
        await client.get(attributionUrl, {
          prefixUrl: '',
          responseType: 'json',
        })

        // finally, stream on!
        return { stream, size }
      },
    )
  }

  async #withErrorHandling(tag, fn) {
    // @ts-ignore
    return withProviderErrorHandling({
      fn,
      tag,
      providerName: 'Unsplash',
      getJsonErrorMessage: (body) => body?.errors && String(body.errors),
    })
  }
}
