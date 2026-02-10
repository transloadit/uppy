import got from 'got'
import { prepareStream } from '../../helpers/utils.js'
import Provider from '../Provider.js'
import { withProviderErrorHandling } from '../providerErrors.js'
import adaptData from './adapter.js'

const BOX_FILES_FIELDS = 'id,modified_at,name,permissions,size,type'
const BOX_THUMBNAIL_SIZE = 256

const getClient = ({ token }) =>
  got.extend({
    prefixUrl: 'https://api.box.com/2.0',
    headers: {
      authorization: `Bearer ${token}`,
    },
  })

async function getUserInfo({ token }) {
  return getClient({ token })
    .get('users/me', { responseType: 'json' })
    .json<Record<string, unknown>>()
}

async function list({ directory, query, token }) {
  const rootFolderID = '0'
  return getClient({ token })
    .get(`folders/${directory || rootFolderID}/items`, {
      searchParams: {
        fields: BOX_FILES_FIELDS,
        offset: query.cursor,
        limit: 1000,
      },
      responseType: 'json',
    })
    .json<Record<string, unknown>>()
}

/**
 * Adapter for API https://developer.box.com/reference/
 */
export default class Box extends Provider {
  constructor(options) {
    super(options)
    // needed for the thumbnails fetched via companion
    this.needsCookieAuth = true
  }

  static get oauthProvider() {
    return 'box'
  }

  /**
   * Lists files and folders from Box API
   *
   * @param {object} options
   * @param {string} options.directory
   * @param {any} options.query
   * @param {{ accessToken: string }} options.providerUserSession
   * @param {unknown} options.companion
   */
  async list({
    directory,
    providerUserSession: { accessToken: token },
    query,
    companion,
  }) {
    return this.#withErrorHandling('provider.box.list.error', async () => {
      const [userInfo, files] = await Promise.all([
        getUserInfo({ token }),
        list({ directory, query, token }),
      ])

      return adaptData(files, userInfo.login, companion)
    })
  }

  async download({ id, providerUserSession: { accessToken: token } }) {
    return this.#withErrorHandling('provider.box.download.error', async () => {
      const stream = getClient({ token }).stream.get(`files/${id}/content`, {
        responseType: 'json',
      })

      const { size } = await prepareStream(stream)
      return { stream, size }
    })
  }

  async thumbnail({ id, providerUserSession: { accessToken: token } }) {
    return this.#withErrorHandling('provider.box.thumbnail.error', async () => {
      const extension = 'jpg' // you can set this to png to more easily reproduce http 202 retry-after

      // From box API docs:
      // Sometimes generating a thumbnail can take a few seconds.
      // In these situations the API returns a Location-header pointing to a placeholder graphic
      // for this file type.
      // The placeholder graphic can be used in a user interface until the thumbnail generation has completed.
      // The Retry-After-header indicates when to the thumbnail will be ready.
      // At that time, retry this endpoint to retrieve the thumbnail.
      //
      // This can be reproduced more easily by changing extension to png and trying on a newly uploaded image
      const stream = getClient({ token }).stream.get(
        `files/${id}/thumbnail.${extension}`,
        {
          searchParams: {
            max_height: BOX_THUMBNAIL_SIZE,
            max_width: BOX_THUMBNAIL_SIZE,
          },
          responseType: 'json',
        },
      )

      await prepareStream(stream)
      return { stream, contentType: 'image/jpeg' }
    })
  }

  async size({ id, providerUserSession: { accessToken: token } }) {
    return this.#withErrorHandling('provider.box.size.error', async () => {
      const file = await getClient({ token })
        .get(`files/${id}`, { responseType: 'json' })
        .json<Record<string, unknown>>()
      const sizeValue = file.size
      const sizeStr =
        typeof sizeValue === 'string'
          ? sizeValue
          : typeof sizeValue === 'number'
            ? `${sizeValue}`
            : '0'
      return parseInt(sizeStr, 10)
    })
  }

  logout({ companion, providerUserSession: { accessToken: token } }) {
    return this.#withErrorHandling('provider.box.logout.error', async () => {
      const { key, secret } = companion.options.providerOptions.box
      await getClient({ token }).post('oauth2/revoke', {
        prefixUrl: 'https://api.box.com',
        form: {
          client_id: key,
          client_secret: secret,
          token,
        },
        responseType: 'json',
      })

      return { revoked: true }
    })
  }

  async #withErrorHandling(tag, fn) {
    const isRecord = (value: unknown): value is Record<string, unknown> =>
      !!value && typeof value === 'object' && !Array.isArray(value)

    return withProviderErrorHandling({
      fn,
      tag,
      providerName: Box.oauthProvider,
      isAuthError: (response) => response.statusCode === 401,
      getJsonErrorMessage: (body) => {
        if (!isRecord(body)) return undefined
        const message = body.message
        return typeof message === 'string' ? message : undefined
      },
    })
  }
}
