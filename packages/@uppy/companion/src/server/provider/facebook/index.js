import crypto from 'node:crypto'
import got from 'got'
import { HttpError, prepareStream } from '../../helpers/utils.js'
import logger from '../../logger.js'
import Provider from '../Provider.js'
import { withProviderErrorHandling } from '../providerErrors.js'
import { adaptData, sortImages } from './adapter.js'

async function runRequestBatch({ secret, token, requests }) {
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
    .json()

  const responses = responsesRaw.map((response) => ({
    ...response,
    body: JSON.parse(response.body),
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

async function getMediaUrl({ secret, token, id }) {
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

  const sortedImages = sortImages(body.images)
  return sortedImages[sortedImages.length - 1].source
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
  }) {
    return this.#withErrorHandling('provider.facebook.list.error', async () => {
      const qs = { fields: 'name,cover_photo,created_time,type' }

      if (query.cursor) qs.after = query.cursor

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

      const { email } = response1.body
      const list = response2.body
      return adaptData(list, email, directory, query)
    })
  }

  async download({ id, providerUserSession: { accessToken: token } }) {
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

  async logout({ providerUserSession: { accessToken: token } }) {
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

  async #withErrorHandling(tag, fn) {
    return withProviderErrorHandling({
      fn,
      tag,
      providerName: Facebook.oauthProvider,
      isAuthError: (response) =>
        typeof response.body === 'object' && response.body?.error?.code === 190, // Invalid OAuth 2.0 Access Token
      getJsonErrorMessage: (body) => body?.error?.message,
    })
  }
}
