import got from 'got'
import { isRecord } from '../../../helpers/type-guards.ts'
import { prepareStream } from '../../../helpers/utils.ts'
import logger from '../../../logger.ts'
import Provider from '../../Provider.ts'
import { withProviderErrorHandling } from '../../providerErrors.ts'
import adaptData from './adapter.ts'

type InstagramClient = ReturnType<typeof got.extend>

const getClient = ({ token }: { token: string }): InstagramClient =>
  got.extend({
    prefixUrl: 'https://graph.instagram.com',
    headers: {
      authorization: `Bearer ${token}`,
    },
  })

async function getMediaUrl({
  token,
  id,
}: {
  token: string
  id: string
}): Promise<string> {
  const body: unknown = await getClient({ token })
    .get(String(id), {
      searchParams: { fields: 'media_url' },
      responseType: 'json',
    })
    .json()

  const url =
    isRecord(body) && typeof body['media_url'] === 'string'
      ? body['media_url']
      : null
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
  static override getExtraGrantConfig() {
    return {
      protocol: 'https',
      scope: ['user_profile', 'user_media'],
    }
  }

  static override get oauthProvider() {
    return 'instagram'
  }

  override async list({
    directory,
    providerUserSession: { accessToken: token },
    query = { cursor: null },
  }: {
    directory?: string
    providerUserSession: { accessToken: string }
    query?: { cursor?: string | null }
  }): Promise<unknown> {
    return this.#withErrorHandling(
      'provider.instagram.list.error',
      async () => {
        const qs: Record<string, string> = {
          fields:
            'id,media_type,thumbnail_url,media_url,timestamp,children{media_type,media_url,thumbnail_url,timestamp}',
        }

        if (typeof query.cursor === 'string' && query.cursor.length > 0) {
          qs['after'] = query.cursor
        }

        const client = getClient({ token })

        const [me, list] = await Promise.all([
          client
            .get('me', {
              searchParams: { fields: 'username' },
              responseType: 'json',
            })
            .json<{ username?: string }>(),
          client
            .get('me/media', { searchParams: qs, responseType: 'json' })
            .json<Parameters<typeof adaptData>[0]>(),
        ])

        const username = typeof me.username === 'string' ? me.username : null
        const currentQuery: Record<string, string> = {}
        if (typeof query.cursor === 'string')
          currentQuery['cursor'] = query.cursor
        return adaptData(list, username, directory, currentQuery)
      },
    )
  }

  override async download({
    id,
    providerUserSession: { accessToken: token },
  }: {
    id: string
    providerUserSession: { accessToken: string }
  }): Promise<unknown> {
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

  override async thumbnail() {
    // not implementing this because a public thumbnail from instagram will be used instead
    logger.error(
      'call to thumbnail is not implemented',
      'provider.instagram.thumbnail.error',
    )
    throw new Error('call to thumbnail is not implemented')
  }

  override async logout() {
    // access revoke is not supported by Instagram's API
    return {
      revoked: false,
      manual_revoke_url: 'https://www.instagram.com/accounts/manage_access/',
    }
  }

  async #withErrorHandling<T>(tag: string, fn: () => Promise<T>): Promise<T> {
    return withProviderErrorHandling({
      fn,
      tag,
      providerName: Instagram.oauthProvider,
      isAuthError: (response) => {
        const body = response.body
        if (!isRecord(body)) return false
        const err = body['error']
        return isRecord(err) && err['code'] === 190
      }, // Invalid OAuth 2.0 Access Token
      getJsonErrorMessage: (body) => {
        if (!isRecord(body)) return undefined
        const err = body['error']
        if (!isRecord(err)) return undefined
        return typeof err['message'] === 'string' ? err['message'] : undefined
      },
    })
  }
}
