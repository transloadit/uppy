import type { Readable } from 'node:stream'
import got from 'got'
import { isRecord } from '../../helpers/type-guards.ts'
import { prepareStream } from '../../helpers/utils.ts'
import { ProviderApiError } from '../error.ts'
import Provider, { type ProviderListResponse, type Query } from '../Provider.ts'
import { withProviderErrorHandling } from '../providerErrors.ts'
import adaptData from './adapter.ts'

const BASE_URL = 'https://api.unsplash.com'

type UnsplashClient = ReturnType<typeof got.extend>

const getClient = ({ token }: { token: string }): UnsplashClient =>
  got.extend({
    prefixUrl: BASE_URL,
    headers: {
      authorization: `Client-ID ${token}`,
    },
  })

const getPhotoMeta = async (client: UnsplashClient, id: string) =>
  client
    .get(`photos/${id}`, { responseType: 'json' })
    .json<{ links: { download?: string; download_location?: string } }>()

interface UnsplashUserSession {
  accessToken: string
}

/**
 * Adapter for API https://api.unsplash.com
 */
export default class Unsplash extends Provider<UnsplashUserSession> {
  override async list({
    providerUserSession: { accessToken: token },
    query,
  }: {
    providerUserSession: UnsplashUserSession
    query?: Query | undefined
  }): Promise<ProviderListResponse> {
    const q = typeof query?.['q'] === 'string' ? query['q'] : undefined
    if (!q) {
      throw new ProviderApiError('Search query missing', 400)
    }

    return this.#withErrorHandling('provider.unsplash.list.error', async () => {
      const qs = new URLSearchParams({ per_page: '40', query: q })
      if (typeof query?.['cursor'] === 'string') {
        qs.set('page', query['cursor'])
      }

      const response = await getClient({ token })
        .get('search/photos', { searchParams: qs, responseType: 'json' })
        .json<Parameters<typeof adaptData>[0]>()
      return adaptData(response, query)
    })
  }

  override async download({
    id,
    providerUserSession: { accessToken: token },
  }: {
    id: string
    providerUserSession: UnsplashUserSession
  }): Promise<{ stream: Readable; size: number | undefined }> {
    return this.#withErrorHandling(
      'provider.unsplash.download.error',
      async () => {
        const client = getClient({ token })

        const {
          links: { download: url, download_location: attributionUrl },
        } = await getPhotoMeta(client, id)

        if (!url || !attributionUrl) {
          throw new Error(
            'Unexpected Unsplash response: missing download links',
          )
        }

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

  async #withErrorHandling<T>(tag: string, fn: () => Promise<T>): Promise<T> {
    return withProviderErrorHandling({
      fn,
      tag,
      providerName: 'Unsplash',
      getJsonErrorMessage: (body) => {
        if (!isRecord(body)) return undefined
        const errors = body['errors']
        if (typeof errors === 'string') return errors
        if (Array.isArray(errors)) return errors.map(String).join(', ')
        return undefined
      },
    })
  }
}
