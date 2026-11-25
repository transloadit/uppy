import type { Readable } from 'node:stream'

import type { RequestInfo, RequestInit } from 'node-fetch'
import type { Promisable } from 'type-fest'
import type { WebDAVClientOptions } from 'webdav'

import type {
  ProviderDownloadOptions,
  ProviderDownloadResponse,
  ProviderListOptions,
  ProviderListResponse,
  ProviderLogoutResponse,
  ProviderSimpleAuthOptions,
} from '../Provider.js'

import fetch, { Headers, Response } from 'node-fetch'
import { AuthType, createClient, getPatcher } from 'webdav'

import { getProtectedHttpAgent, validateURL } from '../../helpers/request.js'
import { isRecord } from '../../helpers/type-guards.js'
import logger from '../../logger.js'
import { ProviderApiError, ProviderAuthError } from '../error.js'
import { userError } from '../errorCodes.js'
import Provider from '../Provider.js'
import { validateResponseXml } from './validateResponseXml.js'

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
 * webdav client in the process. An embedder that replaces this fetch patch
 * must preserve the same bounds.
 */
export const MAX_WEBDAV_RESPONSE_BYTES = 5 * 1024 * 1024

getPatcher().patch('fetch', async (url: unknown, options: unknown) => {
  // webdav's hot-patcher has no typed fetch boundary.
  const requestOptions = options as RequestInit
  const headers = new Headers(requestOptions.headers)
  // Avoids a decompressor where the server honours it (a server that ignores
  // it gets one, as on main). A compressed body is still capped by `size`,
  // which node-fetch counts after decompression.
  headers.set('accept-encoding', 'identity')
  const response = await fetch(url as RequestInfo, {
    ...requestOptions,
    headers,
    size: MAX_WEBDAV_RESPONSE_BYTES,
  })
  if (response.ok && requestOptions.method?.toUpperCase() === 'PROPFIND') {
    const xml = await response.text()
    validateResponseXml(xml)
    return new Response(xml, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    })
  }
  return response
})

// A parsed URL can't contain whitespace, and node-fetch puts a space after it.
// Don't stop at quotes: `'` stays unencoded in userinfo and paths.
// Only http(s): WebDAV URLs are validated to those schemes, and a literal
// prefix keeps the match linear on long messages.
const urlInText = /https?:\/\/\S+/gi

/**
 * node-fetch's transport errors (connection refused, DNS, TLS) and
 * its refusal of a URL with `user:pass@` quote the full request URL in their
 * message, and a WebDAV URL can be the credential. Keep only each URL's
 * origin, without userinfo, plus the error's name, code and stack frames.
 * HTTP status errors pass unchanged, so mapProviderError() still sees their
 * `status` and `response`: their message never quotes the request URL, only
 * the server's status text.
 */
function redactUrls(err: unknown): unknown {
  if (
    !(err instanceof Error) ||
    err['response' as keyof Error] != null ||
    err['status' as keyof Error] != null
  )
    return err
  const message = err.message.replace(urlInText, (url) => {
    try {
      return `${new URL(url).origin}/[redacted]`
    } catch {
      return '[redacted URL]'
    }
  })
  if (message === err.message) return err
  const redacted = Object.assign(new Error(message), {
    name: err.name,
    ...(isRecord(err) &&
      typeof err['code'] === 'string' && { code: err['code'] }),
  })
  const frames = (err.stack ?? '')
    .split('\n')
    .filter((line) => line.startsWith('    at '))
  redacted.stack = [`${redacted.name}: ${message}`, ...frames].join('\n')
  return redacted
}

/**
 * `ocis`: the share link is from ownCloud Infinite Scale, which serves public
 * links at `/dav/public-files/<token>` rather than `/public.php/webdav/`.
 * Found out once in simpleAuth() and kept in the session.
 */
type WebdavUserSession = { webdavUrl?: string; ocis?: boolean }
type WebdavClient = ReturnType<typeof createClient>

const isPublicLink = (webdavUrl: string) => /\/s\/([^/]+)/.test(webdavUrl)

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

    // Is this an ownCloud, Nextcloud or oCIS public link URL? e.g. https://example.com/s/kFy9Lek5sm928xP
    if (isPublicLink(webdavUrl)) {
      const [baseURL, publicLinkToken] = webdavUrl.split('/s/')
      if (!baseURL) {
        throw new Error('invalid public link url')
      }
      const base = baseURL.replace('/index.php', '')

      return this.getClientHelper({
        url: providerUserSession.ocis
          ? `${base}/dav/public-files/${encodeURIComponent(publicLinkToken)}`
          : `${base}/public.php/webdav/`,
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

      // One deadline for every attempt, so a fallback can't extend it.
      const signal = AbortSignal.timeout(this.requestTimeoutMs)
      // call the list operation as a way to validate the url
      const tryListing = async (providerUserSession: WebdavUserSession) => {
        const client = await this.getClient({ providerUserSession })
        await client.getDirectoryContents(defaultDirectory, { signal })
        return providerUserSession
      }

      try {
        return await tryListing({ webdavUrl })
      } catch (err) {
        // A share link that isn't Nextcloud/ownCloud 10 may be oCIS. If that
        // fails too, report the first error.
        if (!isPublicLink(webdavUrl)) throw err
        return await tryListing({ webdavUrl, ocis: true }).catch(() => {
          throw err
        })
      }
    } catch (err) {
      // The raw error's `response.url` is the WebDAV URL, which for a share
      // link is itself the credential, and transport errors quote the URL in
      // their message. Log and throw the mapped, redacted error instead.
      const mapped = this.mapProviderError(redactUrls(err))
      logger.error(mapped, 'provider.webdav.error')
      const code = isRecord(err) ? err['code'] : undefined
      if (
        typeof code === 'string' &&
        ['ECONNREFUSED', 'ENOTFOUND'].includes(code)
      ) {
        throw userError('WEBDAV_CANNOT_CONNECT', 'Cannot connect to server')
      }
      throw mapped
    }
  }

  /**
   * Redact WebDAV URLs from errors before the base class logs and maps them:
   * the URL may carry the credential (a token in the path or query, or
   * `user:pass@`).
   */
  protected override withErrorHandling<T>(
    tag: string,
    fn: () => Promisable<T>,
  ): Promise<T> {
    return super.withErrorHandling(tag, async () => {
      try {
        return await fn()
      } catch (err) {
        throw redactUrls(err)
      }
    })
  }

  getClientHelper({
    url,
    ...options
  }: { url: string } & WebDAVClientOptions): WebdavClient {
    const { allowLocalUrls } = this
    if (!validateURL(url, allowLocalUrls)) {
      throw new Error('invalid webdav url')
    }
    if (
      decodeURIComponent(new URL(url).pathname).split('/').filter(Boolean)
        .length > 32
    ) {
      throw new Error('WebDAV URL exceeds the maximum folder depth')
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

      for (const item of dir) {
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
      }

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
