// From https://www.dropbox.com/developers/reference/json-encoding:
//
// This function is simple and has OK performance compared to more
// complicated ones: http://jsperf.com/json-escape-unicode/4
import got from 'got'
import { MAX_AGE_REFRESH_TOKEN } from '../../helpers/jwt.ts'
import { isRecord } from '../../helpers/type-guards.ts'
import { prepareStream } from '../../helpers/utils.ts'
import logger from '../../logger.ts'
import Provider from '../Provider.ts'
import { withProviderErrorHandling } from '../providerErrors.ts'
import adaptData from './adapter.ts'

const charsToEncode = /[\u007f-\uffff]/g
function httpHeaderSafeJson(v: unknown): string {
  return JSON.stringify(v).replace(charsToEncode, (c) => {
    return `\\u${`000${c.charCodeAt(0).toString(16)}`.slice(-4)}`
  })
}

type DropboxClient = ReturnType<typeof got.extend>

type DropboxUserInfo = {
  email?: string
  root_info?: {
    root_namespace_id?: string
    home_namespace_id?: string
  }
}

async function getUserInfo({
  client,
}: {
  client: DropboxClient
}): Promise<DropboxUserInfo> {
  return client
    .post('users/get_current_account', { responseType: 'json' })
    .json<DropboxUserInfo>()
}

async function getClient({
  token,
  namespaced,
}: {
  token: string
  namespaced: boolean
}): Promise<{ client: DropboxClient; userInfo: DropboxUserInfo }> {
  const makeClient = (namespace?: string) =>
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
  const rootInfo = userInfo.root_info
  if (
    namespaced &&
    rootInfo != null &&
    rootInfo.root_namespace_id != null &&
    rootInfo.home_namespace_id != null &&
    rootInfo.root_namespace_id !== rootInfo.home_namespace_id
  ) {
    logger.debug('using root_namespace_id', rootInfo.root_namespace_id)
    client = makeClient(rootInfo.root_namespace_id)
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

async function list({
  client,
  directory,
  query,
}: {
  client: DropboxClient
  directory?: string
  query: { cursor?: string; [k: string]: unknown }
}): Promise<Parameters<typeof adaptData>[0]> {
  if (query.cursor) {
    return client
      .post('files/list_folder/continue', {
        json: { cursor: query.cursor },
        responseType: 'json',
      })
      .json<Parameters<typeof adaptData>[0]>()
  }

  const searchParams: Record<string, string> = {}
  for (const [k, v] of Object.entries(query)) {
    if (typeof v === 'string') searchParams[k] = v
  }

  return client
    .post('files/list_folder', {
      searchParams,
      json: {
        path: `${directory || ''}`,
        include_non_downloadable_files: false,
        // min=1, max=2000 (default: 500): The maximum number of results to return per request.
        limit: 2000,
      },
      responseType: 'json',
    })
    .json<Parameters<typeof adaptData>[0]>()
}

async function fetchSearchEntries({
  client,
  query,
}: {
  client: DropboxClient
  query: { q: string; path?: string; [k: string]: unknown }
}): Promise<Parameters<typeof adaptData>[0]> {
  const scopePath =
    typeof query.path === 'string' ? decodeURIComponent(query.path) : undefined

  type DropboxSearchResponse = {
    matches: Array<{
      metadata: { metadata: Parameters<typeof adaptData>[0]['entries'][number] }
    }>
    has_more: boolean
    cursor?: string
  }

  const searchRes = await client
    .post('files/search_v2', {
      json: {
        query: query.q.trim(),
        options: {
          path: scopePath || '',
          max_results: 1000,
          file_status: 'active',
          filename_only: false,
        },
      },
      responseType: 'json',
    })
    .json<DropboxSearchResponse>()

  const entries = searchRes.matches.map((m) => m.metadata.metadata)
  return {
    entries,
    has_more: searchRes.has_more,
    cursor: searchRes.cursor,
  }
}

/**
 * Adapter for API https://www.dropbox.com/developers/documentation/http/documentation
 */
export default class Dropbox extends Provider {
  constructor(options: ConstructorParameters<typeof Provider>[0]) {
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
   * Search entries
   */
  async search(options: {
    providerUserSession: { accessToken: string }
    query: { q: string; path?: string; [k: string]: unknown }
    companion: { buildURL: Parameters<typeof adaptData>[2] }
  }): Promise<unknown> {
    return this.#withErrorHandling(
      'provider.dropbox.search.error',
      async () => {
        const { client, userInfo } = await getClient({
          token: options.providerUserSession.accessToken,
          namespaced: true,
        })

        const stats = await fetchSearchEntries({ client, query: options.query })
        const { email } = userInfo
        // we don't really need email, but let's mimic `list` response shape for consistency
        return adaptData(stats, email, options.companion.buildURL)
      },
    )
  }

  /**
   * List folder entries
   */
  async list(options: {
    providerUserSession: { accessToken: string }
    directory?: string
    query: { cursor?: string; [k: string]: unknown }
    companion: { buildURL: Parameters<typeof adaptData>[2] }
  }): Promise<unknown> {
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

  async download({
    id,
    providerUserSession: { accessToken: token },
  }: {
    id: string
    providerUserSession: { accessToken: string }
  }): Promise<unknown> {
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

  async thumbnail({
    id,
    providerUserSession: { accessToken: token },
  }: {
    id: string
    providerUserSession: { accessToken: string }
  }): Promise<unknown> {
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

  async size({
    id,
    providerUserSession: { accessToken: token },
  }: {
    id: string
    providerUserSession: { accessToken: string }
  }): Promise<number> {
    return this.#withErrorHandling('provider.dropbox.size.error', async () => {
      const meta = await (await getClient({ token, namespaced: true })).client
        .post('files/get_metadata', {
          json: { path: id },
          responseType: 'json',
        })
        .json<{ size?: unknown }>()
      const sizeValue = meta?.size
      const sizeStr =
        typeof sizeValue === 'string'
          ? sizeValue
          : typeof sizeValue === 'number'
            ? `${sizeValue}`
            : ''
      return parseInt(sizeStr, 10)
    })
  }

  async logout({
    providerUserSession: { accessToken: token },
  }: {
    providerUserSession: { accessToken: string }
  }): Promise<{ revoked: true }> {
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

  async refreshToken({
    clientId,
    clientSecret,
    refreshToken,
  }: {
    clientId: string
    clientSecret: string
    refreshToken: string
  }): Promise<{ accessToken: string }> {
    return this.#withErrorHandling(
      'provider.dropbox.token.refresh.error',
      async () => {
        const tokenRes = await getOauthClient()
          .post('token', {
            form: {
              refresh_token: refreshToken,
              grant_type: 'refresh_token',
              client_id: clientId,
              client_secret: clientSecret,
            },
          })
          .json<{ access_token?: unknown }>()
        const accessToken = tokenRes.access_token
        if (typeof accessToken !== 'string' || accessToken.length === 0) {
          throw new Error('Missing access_token')
        }
        return { accessToken }
      },
    )
  }

  async #withErrorHandling<T>(tag: string, fn: () => Promise<T>): Promise<T> {
    return withProviderErrorHandling({
      fn,
      tag,
      providerName: Dropbox.oauthProvider,
      isAuthError: (response: { statusCode?: number }) =>
        response.statusCode === 401,
      getJsonErrorMessage: (body) => {
        if (!isRecord(body)) return undefined
        const summary = body.error_summary
        return typeof summary === 'string' ? summary : undefined
      },
    })
  }
}
