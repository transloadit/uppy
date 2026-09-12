import type { Readable } from 'node:stream'
import type { WebDAVClientOptions } from 'webdav'
import { AuthType, createClient } from 'webdav'
import { getProtectedHttpAgent, validateURL } from '../../helpers/request.js'
import { isRecord } from '../../helpers/type-guards.js'
import logger from '../../logger.js'
import {
  ProviderApiError,
  ProviderAuthError,
  ProviderUserError,
} from '../error.js'
import Provider, { type Query } from '../Provider.js'

const defaultDirectory = '/'

// Nextcloud/ownCloud/oCIS public share links look like https://host/s/<token>
const isPublicLinkUrl = (url: string): boolean => /\/s\/([^/]+)/.test(url)

type WebdavUserSession = {
  webdavUrl?: string
  // For public share links, the actual WebDAV endpoint resolved from the share
  // URL (see getPublicLinkClient). Cached so we only probe for it once.
  publicLinkUrl?: string
}
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

  async getClient({
    providerUserSession,
  }: {
    providerUserSession: WebdavUserSession
  }): Promise<WebdavClient> {
    const webdavUrl = providerUserSession?.webdavUrl
    const { allowLocalUrls } = this
    if (
      webdavUrl == null ||
      webdavUrl.length === 0 ||
      !validateURL(webdavUrl, allowLocalUrls)
    ) {
      throw new Error('invalid public link url')
    }

    // Is this an ownCloud, Nextcloud or oCIS public link URL?
    // e.g. https://example.com/s/kFy9Lek5sm928xP
    if (isPublicLinkUrl(webdavUrl)) {
      const { client } = await this.getPublicLinkClient({ providerUserSession })
      return client
    }

    // normal public WebDAV urls
    return this.getClientHelper({
      url: webdavUrl,
      authType: AuthType.None,
    })
  }

  /**
   * Build a WebDAV client for a public share link (e.g. https://host/s/<token>).
   *
   * Servers expose public shares at different, non-discoverable WebDAV paths:
   *   - Nextcloud / ownCloud 10: <base>/public.php/webdav/
   *   - oCIS (ownCloud Infinite Scale): <base>/dav/public-files/<token>
   *
   * There is no standard WebDAV (or reliably-shaped capabilities) way to discover
   * which one a given server uses, so we probe the known candidates with a cheap
   * PROPFIND and use the first that answers as WebDAV. Hitting the wrong endpoint
   * returns an HTML page, which the webdav client rejects with
   * "Invalid response: No root multistatus found", so we just move on to the next
   * candidate. The resolved endpoint is cached on the session (`publicLinkUrl`) so
   * we only probe once per share.
   */
  async getPublicLinkClient({
    providerUserSession,
  }: {
    providerUserSession: WebdavUserSession
  }): Promise<{ client: WebdavClient; url: string }> {
    const { webdavUrl, publicLinkUrl } = providerUserSession
    const [baseURL, publicLinkToken] = (webdavUrl ?? '').split('/s/')
    if (!baseURL || !publicLinkToken) {
      throw new Error('invalid public link url')
    }

    const makeClient = (url: string) =>
      this.getClientHelper({
        url,
        authType: AuthType.Password,
        username: publicLinkToken,
        password: 'null',
      })

    // Already resolved for this session: reuse it without probing again.
    if (publicLinkUrl != null && publicLinkUrl.length > 0) {
      return { client: await makeClient(publicLinkUrl), url: publicLinkUrl }
    }

    const base = baseURL.replace('/index.php', '')
    const candidateUrls = [
      `${base}/public.php/webdav/`, // Nextcloud, ownCloud 10
      `${base}/dav/public-files/${publicLinkToken}`, // oCIS (ownCloud Infinite Scale)
    ]

    let lastErr: unknown
    for (const url of candidateUrls) {
      const client = await makeClient(url)
      try {
        // cheap depth-0 PROPFIND to verify this endpoint actually speaks WebDAV
        await client.stat(defaultDirectory)
        return { client, url }
      } catch (err) {
        lastErr = err
      }
    }

    // None answered as WebDAV. Fall back to the default endpoint so the caller
    // surfaces a meaningful error instead of a probe artifact.
    const errForLog =
      lastErr instanceof Error ? lastErr : new Error(String(lastErr))
    logger.error(errForLog, 'provider.webdav.publicLink.unresolved')
    return {
      client: await makeClient(candidateUrls[0]!),
      url: candidateUrls[0]!,
    }
  }

  override async logout(): Promise<{ revoked: true }> {
    return { revoked: true }
  }

  override async simpleAuth({
    requestBody,
  }: {
    requestBody: unknown
  }): Promise<WebdavUserSession> {
    try {
      if (!isRecord(requestBody) || !isRecord(requestBody['form'])) {
        throw new Error('Invalid request body')
      }
      const webdavUrl = requestBody['form']['webdavUrl']
      if (typeof webdavUrl !== 'string' || webdavUrl.length === 0) {
        throw new Error('Missing webdavUrl')
      }

      const providerUserSession: WebdavUserSession = { webdavUrl }

      let client: WebdavClient
      if (isPublicLinkUrl(webdavUrl)) {
        // Resolve the actual WebDAV endpoint now and cache it on the session so
        // subsequent list/download requests don't have to probe again.
        const resolved = await this.getPublicLinkClient({ providerUserSession })
        providerUserSession.publicLinkUrl = resolved.url
        client = resolved.client
      } else {
        client = await this.getClient({ providerUserSession })
      }
      // call the list operation as a way to validate the url
      await client.getDirectoryContents(defaultDirectory)

      return providerUserSession
    } catch (err) {
      const errForLog = err instanceof Error ? err : new Error(String(err))
      logger.error(errForLog, 'provider.webdav.error')
      const code = isRecord(err) ? err['code'] : undefined
      if (
        typeof code === 'string' &&
        ['ECONNREFUSED', 'ENOTFOUND'].includes(code)
      ) {
        throw new ProviderUserError({ message: 'Cannot connect to server' })
      }
      throw err
    }
  }

  async getClientHelper({
    url,
    ...options
  }: { url: string } & WebDAVClientOptions): Promise<WebdavClient> {
    const { allowLocalUrls } = this
    if (!validateURL(url, allowLocalUrls)) {
      throw new Error('invalid webdav url')
    }
    const { protocol } = new URL(url)
    const HttpAgentClass = getProtectedHttpAgent({
      protocol,
      allowLocalIPs: !allowLocalUrls,
    })

    return createClient(url, {
      ...options,
      [`${protocol}Agent`]: new HttpAgentClass(),
    })
  }

  override async list({
    providerUserSession,
    query,
    directory,
  }: {
    providerUserSession: WebdavUserSession
    query?: Query | undefined
    directory?: string | undefined
  }): Promise<{ items: WebdavListItem[] }> {
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
      )

      dir.forEach((item) => {
        const isFolder = item.type === 'directory'
        const requestPath = encodeURIComponent(
          `${directory || ''}/${item.basename}`,
        )

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

  override async download({
    id,
    providerUserSession,
  }: {
    id: string
    providerUserSession: WebdavUserSession
  }): Promise<{ stream: Readable; size: number | undefined }> {
    return this.withErrorHandling(
      'provider.webdav.download.error',
      async () => {
        const client = await this.getClient({ providerUserSession })
        const statResult = await client.stat(id)
        const stat = 'data' in statResult ? statResult.data : statResult
        const stream = client.createReadStream(`/${id}`)
        return { stream, size: stat.size }
      },
    )
  }

  override async thumbnail({
    id,
    providerUserSession,
  }: {
    id: string
    providerUserSession: WebdavUserSession
  }): Promise<never> {
    // not implementing this because a public thumbnail from webdav will be used instead
    logger.error(
      'call to thumbnail is not implemented',
      'provider.webdav.thumbnail.error',
    )
    throw new Error('call to thumbnail is not implemented')
  }

  async withErrorHandling<T>(tag: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn()
    } catch (err: unknown) {
      let err2: unknown = err
      const status = isRecord(err) ? err['status'] : undefined
      if (status === 401) err2 = new ProviderAuthError()
      const response = isRecord(err) ? err['response'] : undefined
      if (response != null) {
        err2 = new ProviderApiError(
          'WebDAV API error',
          typeof status === 'number' ? status : undefined,
        )
      }
      const errForLog = err2 instanceof Error ? err2 : new Error(String(err2))
      logger.error(errForLog, tag)
      throw err2
    }
  }
}
