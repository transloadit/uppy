import got from 'got'
import { prepareStream } from '../../../helpers/utils.js'
import logger from '../../../logger.js'
import Provider from '../../Provider.js'
import { withProviderErrorHandling } from '../../providerErrors.js'
import adaptData from './adapter.js'

const getClient = ({ token }) =>
  got.extend({
    prefixUrl: 'https://graph.instagram.com',
    headers: {
      authorization: `Bearer ${token}`,
    },
  })

async function getMediaUrl({ token, id }) {
  const body = await getClient({ token })
    .get(String(id), {
      searchParams: { fields: 'media_url' },
      responseType: 'json',
    })
    .json()
  return body.media_url
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
        const qs = {
          fields:
            'id,media_type,thumbnail_url,media_url,timestamp,children{media_type,media_url,thumbnail_url,timestamp}',
        }

        if (query.cursor) qs.after = query.cursor

        const client = getClient({ token })

        const [{ username }, list] = await Promise.all([
          client
            .get('me', {
              searchParams: { fields: 'username' },
              responseType: 'json',
            })
            .json(),
          client
            .get('me/media', { searchParams: qs, responseType: 'json' })
            .json(),
        ])
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
      isAuthError: (response) =>
        typeof response.body === 'object' && response.body?.error?.code === 190, // Invalid OAuth 2.0 Access Token
      getJsonErrorMessage: (body) => body?.error?.message,
    })
  }
}
