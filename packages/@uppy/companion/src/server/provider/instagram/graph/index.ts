import got from 'got'
import adaptData from './adapter.ts'
import { withProviderErrorHandling } from '../../providerErrors.ts'
import Provider from '../../Provider.ts'
import logger from '../../../logger.ts'
import { prepareStream } from '../../../helpers/utils.ts'
import { isRecord } from '../../../helpers/type-guards.ts'

const getClient = ({ token }) =>
  got.extend({
    prefixUrl: 'https://graph.instagram.com',
    headers: {
      authorization: `Bearer ${token}`,
    },
  })

async function getMediaUrl({ token, id }) {
  const body: unknown = await getClient({ token })
    .get(String(id), {
      searchParams: { fields: 'media_url' },
      responseType: 'json',
    })
    .json()

  const url =
    isRecord(body) && typeof body.media_url === 'string' ? body.media_url : null
  if (!url) {
    throw new Error('Unexpected Instagram response: missing media_url')
  }
  return url
}

/**
 * Adapter for API https://developers.facebook.com/docs/instagram-api/overview
 */
export default class Instagram extends Provider {
  // for "grant"
  static getExtraGrantConfig() {
    return {
      protocol: 'https',
      scope: ['user_profile', 'user_media'],
    }
  }

  static get oauthProvider() {
    return 'instagram'
  }

  async list({
    directory,
    providerUserSession: { accessToken: token },
    query = { cursor: null },
  }) {
    return this.#withErrorHandling(
      'provider.instagram.list.error',
      async () => {
        const qs: Record<string, string> = {
          fields:
            'id,media_type,thumbnail_url,media_url,timestamp,children{media_type,media_url,thumbnail_url,timestamp}',
        }

        if (typeof query.cursor === 'string' && query.cursor.length > 0) {
          qs.after = query.cursor
        }

        const client = getClient({ token })

        const [me, list] = await Promise.all([
          client
            .get('me', {
              searchParams: { fields: 'username' },
              responseType: 'json',
            })
            .json<Record<string, unknown>>(),
          client
            .get('me/media', { searchParams: qs, responseType: 'json' })
            .json(),
        ])

        const username = typeof me.username === 'string' ? me.username : null
        return adaptData(list, username, directory, query)
      },
    )
  }

  async download({ id, providerUserSession: { accessToken: token } }) {
    return this.#withErrorHandling(
      'provider.instagram.download.error',
      async () => {
        const url = await getMediaUrl({ token, id })
        const stream = got.stream.get(url, { responseType: 'json' })
        const { size } = await prepareStream(stream)
        return { stream, size }
      },
    )
  }

  async thumbnail() {
    // not implementing this because a public thumbnail from instagram will be used instead
    logger.error(
      'call to thumbnail is not implemented',
      'provider.instagram.thumbnail.error',
    )
    throw new Error('call to thumbnail is not implemented')
  }

  async logout() {
    // access revoke is not supported by Instagram's API
    return {
      revoked: false,
      manual_revoke_url: 'https://www.instagram.com/accounts/manage_access/',
    }
  }

  async #withErrorHandling(tag, fn) {
    return withProviderErrorHandling({
      fn,
      tag,
      providerName: Instagram.oauthProvider,
      isAuthError: (response) => {
        const body = response.body
        if (!isRecord(body)) return false
        const err = body.error
        return isRecord(err) && err.code === 190
      }, // Invalid OAuth 2.0 Access Token
      getJsonErrorMessage: (body) => {
        if (!isRecord(body)) return undefined
        const err = body.error
        if (!isRecord(err)) return undefined
        return typeof err.message === 'string' ? err.message : undefined
      },
    })
  }
}
