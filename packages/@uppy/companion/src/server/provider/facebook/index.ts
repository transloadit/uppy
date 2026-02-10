import crypto from 'node:crypto'
import got from 'got'
import { isRecord } from '../../helpers/type-guards.ts'
import { HttpError, prepareStream } from '../../helpers/utils.ts'
import logger from '../../logger.ts'
import Provider from '../Provider.ts'
import { withProviderErrorHandling } from '../providerErrors.ts'
import { adaptData, sortImages } from './adapter.ts'

type FacebookBatchRequest = {
  method: string
  relative_url: string
}

type FacebookBatchResponse = { code: number; body: unknown }

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
    .json<Array<{ code: number; body: string }>>()

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
  const [{ body }] = await runRequestBatch({
    secret,
    token,
    requests: [
      {
        method: 'GET',
        relative_url: `${id}?${new URLSearchParams({ fields: 'images' }).toString()}`,
      },
    ],
  })

  const imagesValue = isRecord(body) ? body.images : undefined

  const isFbImage = (
    value: unknown,
  ): value is { width: number; source: string } =>
    isRecord(value) &&
    typeof value.width === 'number' &&
    typeof value.source === 'string'

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
export default class Facebook extends Provider {
  static get oauthProvider() {
    return 'facebook'
  }

  async list({
    directory,
    providerUserSession: { accessToken: token },
    query = { cursor: null },
  }: {
    directory?: string
    providerUserSession: { accessToken: string }
    query?: { cursor?: string | null }
  }): Promise<unknown> {
    return this.#withErrorHandling('provider.facebook.list.error', async () => {
      const qs: Record<string, string> = {
        fields: 'name,cover_photo,created_time,type',
      }

      if (typeof query.cursor === 'string' && query.cursor.length > 0) {
        qs.after = query.cursor
      }

      let path = 'me/albums'
      if (directory) {
        path = `${directory}/photos`
        qs.fields = 'icon,images,name,width,height,created_time'
      }

      const [response1, response2] = await runRequestBatch({
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

      const email =
        isRecord(response1.body) && typeof response1.body.email === 'string'
          ? response1.body.email
          : null

      const list = response2.body
      const isFacebookListResponse = (
        value: unknown,
      ): value is Parameters<typeof adaptData>[0] =>
        isRecord(value) && Array.isArray(value.data)
      if (!isFacebookListResponse(list)) {
        throw new Error('Unexpected Facebook response: missing data')
      }

      const currentQuery: Record<string, string> = {}
      if (typeof query.cursor === 'string') currentQuery.cursor = query.cursor
      return adaptData(list, email, directory, currentQuery)
    })
  }

  async download({
    id,
    providerUserSession: { accessToken: token },
  }: {
    id: string
    providerUserSession: { accessToken: string }
  }): Promise<unknown> {
    return this.#withErrorHandling(
      'provider.facebook.download.error',
      async () => {
        const url = await getMediaUrl({ secret: this.secret, token, id })
        const stream = got.stream.get(url, { responseType: 'json' })
        const { size } = await prepareStream(stream)
        return { stream, size }
      },
    )
  }

  async thumbnail() {
    // not implementing this because a public thumbnail from facebook will be used instead
    logger.error(
      'call to thumbnail is not implemented',
      'provider.facebook.thumbnail.error',
    )
    throw new Error('call to thumbnail is not implemented')
  }

  async logout({
    providerUserSession: { accessToken: token },
  }: {
    providerUserSession: { accessToken: string }
  }): Promise<{ revoked: true }> {
    return this.#withErrorHandling(
      'provider.facebook.logout.error',
      async () => {
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
        isRecord(response.body.error) &&
        response.body.error.code === 190, // Invalid OAuth 2.0 Access Token
      getJsonErrorMessage: (body) => {
        if (!isRecord(body)) return undefined
        const error = body.error
        if (!isRecord(error)) return undefined
        const message = error.message
        return typeof message === 'string' ? message : undefined
      },
    })
  }
}
