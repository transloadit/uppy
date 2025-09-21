// From https://www.dropbox.com/developers/reference/json-encoding:
//
// This function is simple and has OK performance compared to more
// complicated ones: http://jsperf.com/json-escape-unicode/4
import got from 'got'
import { MAX_AGE_REFRESH_TOKEN } from '../../helpers/jwt.js'
import { prepareStream } from '../../helpers/utils.js'
import logger from '../../logger.js'
import Provider from '../Provider.js'
import { withProviderErrorHandling } from '../providerErrors.js'
import adaptData from './adapter.js'

const charsToEncode = /[\u007f-\uffff]/g
function httpHeaderSafeJson(v) {
  return JSON.stringify(v).replace(charsToEncode, (c) => {
    return `\\u${(`000${c.charCodeAt(0).toString(16)}`).slice(-4)}`
  })
}

async function getUserInfo({ client }) {
  return client
    .post('users/get_current_account', { responseType: 'json' })
    .json()
}

async function getClient({ token, namespaced }) {
  const makeClient = (namespace) =>
    got.extend({
      prefixUrl: 'https://api.dropboxapi.com/2',
      headers: {
        authorization: `Bearer ${token}`,
        ...(namespace
          ? {
              'Dropbox-API-Path-Root': JSON.stringify({
                '.tag': 'root',
                root: namespace,
              }),
            }
          : {}),
      },
    })

  let client = makeClient()

  const userInfo = await getUserInfo({ client })
  // console.log('userInfo', userInfo)

  // https://www.dropboxforum.com/discussions/101000014/how-to-list-the-contents-of-a-team-folder/258310
  // https://developers.dropbox.com/dbx-team-files-guide#namespaces
  // https://www.dropbox.com/developers/reference/path-root-header-modes
  if (
    namespaced &&
    userInfo.root_info != null &&
    userInfo.root_info.root_namespace_id !==
      userInfo.root_info.home_namespace_id
  ) {
    logger.debug(
      'using root_namespace_id',
      userInfo.root_info.root_namespace_id,
    )
    client = makeClient(userInfo.root_info.root_namespace_id)
  }

  return {
    client,
    userInfo,
  }
}

const getOauthClient = () =>
  got.extend({
    prefixUrl: 'https://api.dropboxapi.com/oauth2',
  })

async function list({ client, directory, query }) {
  const q = query?.q ?? query?.query
  const cursor = query?.cursor
  const isSearch = typeof q === 'string' && q.trim() !== ''

  // Handle pagination first for search mode
  if (isSearch && cursor) {
    const res = await client
      .post('files/search/continue_v2', {
        json: { cursor },
        responseType: 'json',
      })
      .json()

    // Normalize search response to look like list_folder
    const entries = (res.matches || [])
      .map((m) => m?.metadata?.metadata)
      .filter(Boolean)
    return {
      entries,
      has_more: !!res.has_more,
      cursor: res.cursor ?? null,
    }
  }

  if (isSearch) {
    const res = await client
      .post('files/search_v2', {
        json: {
          query: q.trim(),
          options: {
            // path: '', // global search; set to a folder path to scope
            max_results: 200,
            file_status: 'active',
            filename_only: false,
          },
        },
        responseType: 'json',
      })
      .json()

    const entries = (res.matches || [])
      .map((m) => m?.metadata?.metadata)
      .filter(Boolean)
    return {
      entries,
      has_more: !!res.has_more,
      cursor: res.cursor ?? null,
    }
  }

  // Default: folder listing
  if (cursor) {
    return client
      .post('files/list_folder/continue', {
        json: { cursor },
        responseType: 'json',
      })
      .json()
  }

  // directory may arrive URL-encoded (e.g., "%2Ffoo%2Fbar"). Dropbox expects a plain path.
  let path = directory || ''
  try {
    if (typeof path === 'string' && path.includes('%')) {
      path = decodeURIComponent(path)
    }
  } catch (_) {
    // ignore decode errors and keep original path
  }

  return client
    .post('files/list_folder', {
      searchParams: query,
      json: {
        path,
        include_non_downloadable_files: false,
        // min=1, max=2000 (default: 500): The maximum number of results to return per request.
        limit: 2000,
      },
      responseType: 'json',
    })
    .json()
}

/**
 * Adapter for API https://www.dropbox.com/developers/documentation/http/documentation
 */
export default class Dropbox extends Provider {
  constructor(options) {
    super(options)
    this.needsCookieAuth = true
  }

  static get oauthProvider() {
    return 'dropbox'
  }

  static get authStateExpiry() {
    return MAX_AGE_REFRESH_TOKEN
  }

  /**
   *
   * @param {object} options
   */
  async list(options) {
    return this.#withErrorHandling('provider.dropbox.list.error', async () => {
      const { client, userInfo } = await getClient({
        token: options.providerUserSession.accessToken,
        namespaced: true,
      })

      const stats = await list({ ...options, client })
      const { email } = userInfo
      return adaptData(stats, email, options.companion.buildURL)
    })
  }

  async download({ id, providerUserSession: { accessToken: token } }) {
    return this.#withErrorHandling(
      'provider.dropbox.download.error',
      async () => {
        const stream = (
          await getClient({ token, namespaced: true })
        ).client.stream.post('files/download', {
          prefixUrl: 'https://content.dropboxapi.com/2',
          headers: {
            'Dropbox-API-Arg': httpHeaderSafeJson({ path: String(id) }),
            Connection: 'keep-alive', // important because https://github.com/transloadit/uppy/issues/4357
          },
          body: Buffer.alloc(0), // if not, it will hang waiting for the writable stream
          responseType: 'json',
        })

        const { size } = await prepareStream(stream)
        return { stream, size }
      },
    )
  }

  async thumbnail({ id, providerUserSession: { accessToken: token } }) {
    return this.#withErrorHandling(
      'provider.dropbox.thumbnail.error',
      async () => {
        const stream = (
          await getClient({ token, namespaced: true })
        ).client.stream.post('files/get_thumbnail_v2', {
          prefixUrl: 'https://content.dropboxapi.com/2',
          headers: {
            'Dropbox-API-Arg': httpHeaderSafeJson({
              resource: { '.tag': 'path', path: `${id}` },
              size: 'w256h256',
              format: 'jpeg',
            }),
          },
          body: Buffer.alloc(0),
          responseType: 'json',
        })

        await prepareStream(stream)
        return { stream, contentType: 'image/jpeg' }
      },
    )
  }

  async size({ id, providerUserSession: { accessToken: token } }) {
    return this.#withErrorHandling('provider.dropbox.size.error', async () => {
      const { size } = await (
        await getClient({ token, namespaced: true })
      ).client
        .post('files/get_metadata', {
          json: { path: id },
          responseType: 'json',
        })
        .json()
      return parseInt(size, 10)
    })
  }

  async logout({ providerUserSession: { accessToken: token } }) {
    return this.#withErrorHandling(
      'provider.dropbox.logout.error',
      async () => {
        await (await getClient({ token, namespaced: false })).client.post(
          'auth/token/revoke',
          { responseType: 'json' },
        )
        return { revoked: true }
      },
    )
  }

  async refreshToken({ clientId, clientSecret, refreshToken }) {
    return this.#withErrorHandling(
      'provider.dropbox.token.refresh.error',
      async () => {
        const { access_token: accessToken } = await getOauthClient()
          .post('token', {
            form: {
              refresh_token: refreshToken,
              grant_type: 'refresh_token',
              client_id: clientId,
              client_secret: clientSecret,
            },
          })
          .json()
        return { accessToken }
      },
    )
  }

  async #withErrorHandling(tag, fn) {
    return withProviderErrorHandling({
      fn,
      tag,
      providerName: Dropbox.oauthProvider,
      isAuthError: (response) => response.statusCode === 401,
      getJsonErrorMessage: (body) => body?.error_summary,
    })
  }
}
