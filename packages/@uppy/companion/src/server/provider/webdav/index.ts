import type { FileStat, ResponseDataDetailed } from 'webdav'
import { AuthType, createClient } from 'webdav'
import { getProtectedHttpAgent, validateURL } from '../../helpers/request.ts'
import { isRecord } from '../../helpers/type-guards.ts'
import logger from '../../logger.ts'
import {
  ProviderApiError,
  ProviderAuthError,
  ProviderUserError,
} from '../error.ts'
import Provider from '../Provider.ts'

const defaultDirectory = '/'

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
export default class WebdavProvider extends Provider {
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
    if (typeof webdavUrl !== 'string' || webdavUrl.length === 0) {
      throw new Error('invalid public link url')
    }
    if (!validateURL(webdavUrl, allowLocalUrls)) {
      throw new Error('invalid public link url')
    }

    // Is this an ownCloud or Nextcloud public link URL? e.g. https://example.com/s/kFy9Lek5sm928xP
    // they have specific urls that we can identify
    // todo not sure if this is the right way to support nextcloud and other webdavs
    if (/\/s\/([^/]+)/.test(webdavUrl)) {
      const split = webdavUrl.split('/s/')
      const baseURL = split[0]
      const publicLinkToken = split[1]
      if (!baseURL || !publicLinkToken) {
        throw new Error('invalid public link url')
      }

      return this.getClientHelper({
        url: `${baseURL.replace('/index.php', '')}/public.php/webdav/`,
        authType: AuthType.Password,
        username: publicLinkToken,
        password: 'null',
      })
    }

    // normal public WebDAV urls
    return this.getClientHelper({
      url: webdavUrl,
      authType: AuthType.None,
    })
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
        throw new ProviderUserError({ message: 'Invalid request body' })
      }
      const webdavUrl = requestBody['form']['webdavUrl']
      if (typeof webdavUrl !== 'string' || webdavUrl.length === 0) {
        throw new ProviderUserError({ message: 'Missing webdavUrl' })
      }

      const providerUserSession: WebdavUserSession = { webdavUrl }

      const client = await this.getClient({ providerUserSession })
      // call the list operation as a way to validate the url
      await client.getDirectoryContents(defaultDirectory)

      return providerUserSession
    } catch (err: unknown) {
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
  }: { url: string } & Record<string, unknown>): Promise<WebdavClient> {
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
    directory,
    providerUserSession,
  }: {
    directory?: string
    providerUserSession: WebdavUserSession
  }): Promise<{ items: WebdavListItem[] }> {
    return this.withErrorHandling('provider.webdav.list.error', async () => {
      if (!this.isAuthenticated({ providerUserSession })) {
        throw new ProviderAuthError()
      }

      const data: { items: WebdavListItem[] } = { items: [] }
      const client = await this.getClient({ providerUserSession })

      const dirResult: FileStat[] | ResponseDataDetailed<FileStat[]> =
        await client.getDirectoryContents(directory || '/')
      const dir = Array.isArray(dirResult) ? dirResult : dirResult.data

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
          ...(modifiedDate ? { modifiedDate } : {}),
          ...(!isFolder
            ? {
                ...(typeof item.mime === 'string' ? { mimeType: item.mime } : {}),
                ...(typeof item.size === 'number' ? { size: item.size } : {}),
                thumbnail: null,
              }
            : {}),
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
  }): Promise<unknown> {
    return this.withErrorHandling(
      'provider.webdav.download.error',
      async () => {
        const client = await this.getClient({ providerUserSession })
        const statResult: FileStat | ResponseDataDetailed<FileStat> =
          await client.stat(id)
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
