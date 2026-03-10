import crypto from 'node:crypto'
import type { Readable } from 'node:stream'
import got from 'got'
import { isRecord } from '../../helpers/type-guards.ts'
import { HttpError, prepareStream } from '../../helpers/utils.ts'
import logger from '../../logger.ts'
import Provider, { type ProviderListResponse, type Query } from '../Provider.ts'
import { withProviderErrorHandling } from '../providerErrors.ts'
import { adaptData, type FacebookListResponse, sortImages } from './adapter.ts'

type FacebookBatchRequest = {
  method: string
  relative_url: string
}

type FacebookBatchResponse = { code: number; body: unknown }

interface FacebookUserSession {
  accessToken: string
}

async function runRequestBatch({
  secret,
  token,
  requests,
}: {
  secret: string
  token: string
  requests: FacebookBatchRequest[]
}): Promise<FacebookBatchResponse[]> {
  // https://developers.facebook.com/docs/facebook-login/security/#appsecret
  // couldn't get `appsecret_time` working, but it seems to be working without it
  // const time = Math.floor(Date.now() / 1000)
  const appSecretProof = crypto
    .createHmac('sha256', secret)
    // .update(`${token}|${time}`)
    .update(token)
    .digest('hex')

  const form = {
    access_token: token,
    appsecret_proof: appSecretProof,
    // appsecret_time: String(time),
    batch: JSON.stringify(requests),
  }

  const responsesRaw = await got
    .post('https://graph.facebook.com', { form })
    .json<{ code: number; body: string }[]>()

  const responses = responsesRaw.map((response) => ({
    ...response,
    body: (() => {
      const parsed: unknown = JSON.parse(response.body)
      return parsed
    })(),
  }))

  const errorResponse = responses.find((response) => response.code !== 200)
  if (errorResponse) {
    throw new HttpError({
      statusCode: errorResponse.code,
      responseJson: errorResponse.body,
    })
  }

  return responses
}

async function getMediaUrl({
  secret,
  token,
  id,
}: {
  secret: string
  token: string
  id: string
}): Promise<string> {
  const batch = await runRequestBatch({
    secret,
    token,
    requests: [
      {
        method: 'GET',
        relative_url: `${id}?${new URLSearchParams({ fields: 'images' }).toString()}`,
      },
    ],
  })

  const first = batch[0]
  if (!first) throw new Error('Unexpected Facebook response: missing body')
  const body = first.body

  const imagesValue = isRecord(body) ? body['images'] : undefined

  const isFbImage = (
    value: unknown,
  ): value is { width: number; source: string } =>
    isRecord(value) &&
    typeof value['width'] === 'number' &&
    typeof value['source'] === 'string'

  const images = Array.isArray(imagesValue) ? imagesValue.filter(isFbImage) : []
  const sortedImages = sortImages(images)
  const largest = sortedImages[sortedImages.length - 1]
  if (!largest) {
    throw new Error('Unexpected Facebook response: missing images')
  }
  return largest.source
}

/**
 * Adapter for API https://developers.facebook.com/docs/graph-api/using-graph-api/
 */
export default class Facebook extends Provider<FacebookUserSession> {
  static override get oauthProvider() {
    return 'facebook'
  }

  override async list({
    directory,
    providerUserSession: { accessToken: token },
    query,
  }: {
    directory?: string | undefined
    providerUserSession: FacebookUserSession
    query?: Query | undefined
  }): Promise<ProviderListResponse> {
    return this.#withErrorHandling('provider.facebook.list.error', async () => {
      const qs: Record<string, string> = {
        fields: 'name,cover_photo,created_time,type',
      }

      const cursor = query?.['cursor'] ?? null

      if (typeof cursor === 'string') {
        qs['after'] = cursor
      }

      let path = 'me/albums'
      if (directory) {
        path = `${directory}/photos`
        qs['fields'] = 'icon,images,name,width,height,created_time'
      }

      if (this.secret == null) {
        throw new Error('Facebook provider secret is not configured')
      }

      const responses = await runRequestBatch({
        secret: this.secret,
        token,
        requests: [
          {
            method: 'GET',
            relative_url: `me?${new URLSearchParams({ fields: 'email' }).toString()}`,
          },
          { method: 'GET', relative_url: `${path}?${new URLSearchParams(qs)}` },
        ],
      })
      const response1 = responses[0]
      const response2 = responses[1]
      if (!response1 || !response2) {
        throw new Error('Unexpected Facebook response: missing batch result')
      }

      const { email } = response1.body as { email?: string }

      const list = response2.body as FacebookListResponse

      const currentQuery: Record<string, string> = {}
      if (typeof cursor === 'string') currentQuery['cursor'] = cursor
      return adaptData(list, email, directory, currentQuery)
    })
  }

  override async download({
    id,
    providerUserSession: { accessToken: token },
  }: {
    id: string
    providerUserSession: FacebookUserSession
  }): Promise<{ stream: Readable; size: number | undefined }> {
    return this.#withErrorHandling(
      'provider.facebook.download.error',
      async () => {
        if (this.secret == null) {
          throw new Error('Facebook provider secret is not configured')
        }
        const url = await getMediaUrl({ secret: this.secret, token, id })
        const stream = got.stream.get(url, { responseType: 'json' })
        const { size } = await prepareStream(stream)
        return { stream, size }
      },
    )
  }

  override async thumbnail(): Promise<{
    stream: Readable
    contentType: string
  }> {
    // not implementing this because a public thumbnail from facebook will be used instead
    logger.error(
      'call to thumbnail is not implemented',
      'provider.facebook.thumbnail.error',
    )
    throw new Error('call to thumbnail is not implemented')
  }

  override async logout({
    providerUserSession: { accessToken: token },
  }: {
    providerUserSession: FacebookUserSession
  }): Promise<{ revoked: true }> {
    return this.#withErrorHandling(
      'provider.facebook.logout.error',
      async () => {
        if (this.secret == null) {
          throw new Error('Facebook provider secret is not configured')
        }

        await runRequestBatch({
          secret: this.secret,
          token,
          requests: [{ method: 'DELETE', relative_url: 'me/permissions' }],
        })

        return { revoked: true }
      },
    )
  }

  async #withErrorHandling<T>(tag: string, fn: () => Promise<T>): Promise<T> {
    return withProviderErrorHandling({
      fn,
      tag,
      providerName: Facebook.oauthProvider,
      isAuthError: (response) =>
        isRecord(response.body) &&
        isRecord(response.body['error']) &&
        response.body['error']['code'] === 190, // Invalid OAuth 2.0 Access Token
      getJsonErrorMessage: (body) => {
        if (!isRecord(body)) return undefined
        const error = body['error']
        if (!isRecord(error)) return undefined
        const message = error['message']
        return typeof message === 'string' ? message : undefined
      },
    })
  }
}
