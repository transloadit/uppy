import type { Readable } from 'node:stream'
import fetch, { type RequestInfo, type RequestInit } from 'node-fetch'
import type { WebDAVClientOptions } from 'webdav'
import { AuthType, createClient, getPatcher } from 'webdav'
import { getProtectedHttpAgent, validateURL } from '../../helpers/request.js'
import { isRecord } from '../../helpers/type-guards.js'
import logger from '../../logger.js'
import { ProviderApiError, ProviderAuthError } from '../error.js'
import { userError } from '../errorCodes.js'
import Provider, {
  type ProviderDownloadOptions,
  type ProviderDownloadResponse,
  type ProviderListOptions,
  type ProviderListResponse,
  type ProviderLogoutResponse,
  type ProviderSimpleAuthOptions,
} from '../Provider.js'

const defaultDirectory = '/'

/**
 * Upper bound on a WebDAV response that Companion buffers in memory
 * (PROPFIND listings and stat calls). The `webdav` package reads those with
 * `response.text()` after decompression and parses them synchronously, so an
 * anonymous caller pointing simple-auth at a hostile server could inflate a
 * small gzip body into hundreds of megabytes and abort the process.
 * node-fetch enforces `size` only when a body is consumed whole, so file
 * downloads (which stream `response.body`) are not limited by this.
 *
 * The webdav patcher is a package-wide singleton, so this applies to every
 * webdav client in the process, and a later `getPatcher().patch('fetch', …)`
 * by an embedding app would replace it.
 */
export const MAX_WEBDAV_RESPONSE_BYTES = 5 * 1024 * 1024

getPatcher().patch('fetch', (url: unknown, options: unknown) =>
  fetch(url as RequestInfo, {
    ...(options as RequestInit),
    size: MAX_WEBDAV_RESPONSE_BYTES,
  }),
)

type WebdavUserSession = { webdavUrl?: string }
type WebdavClient = ReturnType<typeof createClient>

type WebdavListItem = {
  isFolder: boolean
  icon: string
  id: string
  name: string
  modifiedDate?: string
  requestPath: string
  mimeType?: string
  size?: number
  thumbnail?: null
}

/**
 * Adapter for WebDAV servers that support simple auth (non-OAuth).
 */
export default class WebdavProvider extends Provider<WebdavUserSession> {
  requestTimeoutMs = 30_000
  static override get hasSimpleAuth() {
    return true
  }

  isAuthenticated({
    providerUserSession,
  }: {
    providerUserSession: WebdavUserSession
  }): boolean {
    return providerUserSession.webdavUrl != null
  }

  getClient({
    providerUserSession,
  }: {
    providerUserSession: WebdavUserSession
  }): WebdavClient {
    const webdavUrl = providerUserSession?.webdavUrl
    const { allowLocalUrls } = this
    if (
      webdavUrl == null ||
      webdavUrl.length === 0 ||
      !validateURL(webdavUrl, allowLocalUrls)
    ) {
      throw new Error('invalid public link url')
    }

    // Is this an ownCloud or Nextcloud public link URL? e.g. https://example.com/s/kFy9Lek5sm928xP
    // they have specific urls that we can identify
    // todo not sure if this is the right way to support nextcloud and other webdavs
    if (/\/s\/([^/]+)/.test(webdavUrl)) {
      const [baseURL, publicLinkToken] = webdavUrl.split('/s/')
      if (!baseURL) {
        throw new Error('invalid public link url')
      }

      return this.getClientHelper({
        url: `${baseURL.replace('/index.php', '')}/public.php/webdav/`,
        authType: AuthType.Password,
        username: publicLinkToken!,
        password: 'null',
      })
    }

    // normal public WebDAV urls
    return this.getClientHelper({
      url: webdavUrl,
      authType: AuthType.None,
    })
  }

  override logout(): ProviderLogoutResponse {
    return { revoked: true }
  }

  override async simpleAuth({
    requestBody,
  }: ProviderSimpleAuthOptions): Promise<WebdavUserSession> {
    try {
      if (!isRecord(requestBody) || !isRecord(requestBody['form'])) {
        throw new Error('Invalid request body')
      }
      const webdavUrl = requestBody['form']['webdavUrl']
      if (typeof webdavUrl !== 'string' || webdavUrl.length === 0) {
        throw new Error('Missing webdavUrl')
      }

      const providerUserSession: WebdavUserSession = { webdavUrl }

      const client = await this.getClient({ providerUserSession })
      // call the list operation as a way to validate the url
      await client.getDirectoryContents(defaultDirectory, {
        signal: AbortSignal.timeout(this.requestTimeoutMs),
      })

      return providerUserSession
    } catch (err) {
      const errForLog = err instanceof Error ? err : new Error(String(err))
      logger.error(errForLog, 'provider.webdav.error')
      const code = isRecord(err) ? err['code'] : undefined
      if (
        typeof code === 'string' &&
        ['ECONNREFUSED', 'ENOTFOUND'].includes(code)
      ) {
        throw userError('WEBDAV_CANNOT_CONNECT', 'Cannot connect to server')
      }
      throw err
    }
  }

  getClientHelper({
    url,
    ...options
  }: { url: string } & WebDAVClientOptions): WebdavClient {
    const { allowLocalUrls } = this
    if (!validateURL(url, allowLocalUrls)) {
      throw new Error('invalid webdav url')
    }
    const HttpAgent = getProtectedHttpAgent({
      protocol: 'http',
      allowLocalIPs: allowLocalUrls,
    })
    const HttpsAgent = getProtectedHttpAgent({
      protocol: 'https',
      allowLocalIPs: allowLocalUrls,
    })

    return createClient(url, {
      ...options,
      httpAgent: new HttpAgent(),
      httpsAgent: new HttpsAgent(),
    })
  }

  override list({
    providerUserSession,
    query,
  }: ProviderListOptions<WebdavUserSession>): Promise<ProviderListResponse> {
    return this.withErrorHandling('provider.webdav.list.error', async () => {
      if (!this.isAuthenticated({ providerUserSession })) {
        throw new ProviderAuthError()
      }

      const data: { items: WebdavListItem[] } = { items: [] }
      const client = await this.getClient({ providerUserSession })

      const dir = await client.getDirectoryContents(
        (typeof query?.['directory'] === 'string'
          ? query?.['directory']
          : undefined) || '/',
        { signal: AbortSignal.timeout(this.requestTimeoutMs) },
      )

      dir.forEach((item) => {
        const isFolder = item.type === 'directory'
        // The server's own path for the item. Prefixing the client-supplied
        // route id instead let one request allocate (id length × item count)
        // bytes of strings, enough to exhaust the heap.
        const requestPath = encodeURIComponent(item.filename)

        let modifiedDate: string | undefined
        try {
          modifiedDate = new Date(item.lastmod).toISOString()
        } catch (_e) {
          // ignore invalid date from server
        }

        // Determine icon based on type and MIME type
        let icon = 'file'
        if (isFolder) {
          icon = 'folder'
        } else if (item.mime?.startsWith('video/')) {
          icon = 'video'
        }

        const listItem: WebdavListItem = {
          isFolder,
          icon,
          id: requestPath,
          name: item.basename,
          requestPath,
          ...(modifiedDate && { modifiedDate }),
          ...(!isFolder && {
            ...(item.mime != null && { mimeType: item.mime }),
            ...(item.size != null && { size: item.size }),
            thumbnail: null,
          }),
        }
        data.items.push(listItem)
      })

      return data
    })
  }

  override download({
    id,
    providerUserSession,
  }: ProviderDownloadOptions<WebdavUserSession>): Promise<ProviderDownloadResponse> {
    return this.withErrorHandling(
      'provider.webdav.download.error',
      async () => {
        const client = await this.getClient({ providerUserSession })
        const statResult = await client.stat(id, {
          signal: AbortSignal.timeout(this.requestTimeoutMs),
        })
        const stat = 'data' in statResult ? statResult.data : statResult
        // createReadStream() returns a PassThrough before the GET is answered
        // and reports a refused GET as an 'error' event on it; nothing listens
        // until the client's progress socket connects, so the event was fatal.
        // Await the GET instead so a non-2xx rejects here and gets mapped.
        // Bound only the wait for response headers: a server that accepts the
        // connection and never answers must not pin the request. The body that
        // follows is deliberately left unbounded (a real download may be slow),
        // so clear the timer once headers are in.
        const ac = new AbortController()
        const timer = setTimeout(() => ac.abort(), this.requestTimeoutMs)
        let response: Awaited<ReturnType<typeof client.customRequest>>
        try {
          response = await client.customRequest(`/${id}`, {
            method: 'GET',
            signal: ac.signal,
          })
        } catch (err) {
          // A refused GET still has its body on the wire, and nothing reads
          // it: drop the connection rather than let the server trickle on.
          ac.abort()
          throw err
        } finally {
          clearTimeout(timer)
        }
        // webdav types its Response minimally; under Node it is node-fetch's,
        // whose body is a Readable.
        const { body } = response as unknown as { body: Readable }
        return { stream: body, size: stat.size }
      },
    )
  }

  override thumbnail(): Promise<never> {
    // not implementing this because a public thumbnail from webdav will be used instead
    logger.error(
      'call to thumbnail is not implemented',
      'provider.webdav.thumbnail.error',
    )
    throw new Error('call to thumbnail is not implemented')
  }

  protected override mapProviderError(err: unknown): unknown {
    const status = isRecord(err) ? err['status'] : undefined
    if (status === 401) return new ProviderAuthError()
    const response = isRecord(err) ? err['response'] : undefined
    if (response != null) {
      return new ProviderApiError(
        'WebDAV API error',
        typeof status === 'number' ? status : undefined,
      )
    }
    return err
  }
}
