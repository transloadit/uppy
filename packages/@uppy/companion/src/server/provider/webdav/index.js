import { AuthType, createClient } from 'webdav'
import { getProtectedHttpAgent, validateURL } from '../../helpers/request.js'
import logger from '../../logger.js'
import {
  ProviderApiError,
  ProviderAuthError,
  ProviderUserError,
} from '../error.js'
import Provider from '../Provider.js'

const defaultDirectory = '/'

/**
 * Adapter for WebDAV servers that support simple auth (non-OAuth).
 */
export default class WebdavProvider extends Provider {
  static get hasSimpleAuth() {
    return true
  }

  isAuthenticated({ providerUserSession }) {
    return providerUserSession.webdavUrl != null
  }

  async getClient({ providerUserSession }) {
    const webdavUrl = providerUserSession?.webdavUrl
    const { allowLocalUrls } = this
    if (!validateURL(webdavUrl, allowLocalUrls)) {
      throw new Error('invalid public link url')
    }

    // Is this an ownCloud or Nextcloud public link URL? e.g. https://example.com/s/kFy9Lek5sm928xP
    // they have specific urls that we can identify
    // todo not sure if this is the right way to support nextcloud and other webdavs
    if (/\/s\/([^/]+)/.test(webdavUrl)) {
      const [baseURL, publicLinkToken] = webdavUrl.split('/s/')

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

  async logout() {
    return { revoked: true }
  }

  async simpleAuth({ requestBody }) {
    try {
      const providerUserSession = { webdavUrl: requestBody.form.webdavUrl }

      const client = await this.getClient({ providerUserSession })
      // call the list operation as a way to validate the url
      await client.getDirectoryContents(defaultDirectory)

      return providerUserSession
    } catch (err) {
      logger.error(err, 'provider.webdav.error')
      if (['ECONNREFUSED', 'ENOTFOUND'].includes(err.code)) {
        throw new ProviderUserError({ message: 'Cannot connect to server' })
      }
      throw err
    }
  }

  async getClientHelper({ url, ...options }) {
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

  async list({ directory, providerUserSession }) {
    return this.withErrorHandling('provider.webdav.list.error', async () => {
      // @ts-ignore
      if (!this.isAuthenticated({ providerUserSession })) {
        throw new ProviderAuthError()
      }

      const data = { items: [] }
      const client = await this.getClient({ providerUserSession })

      /** @type {any} */
      const dir = await client.getDirectoryContents(directory || '/')

      dir.forEach((item) => {
        const isFolder = item.type === 'directory'
        const requestPath = encodeURIComponent(
          `${directory || ''}/${item.basename}`,
        )

        let modifiedDate
        try {
          modifiedDate = new Date(item.lastmod).toISOString()
        } catch (_e) {
          // ignore invalid date from server
        }

        data.items.push({
          isFolder,
          id: requestPath,
          name: item.basename,
          modifiedDate,
          requestPath,
          ...(!isFolder && {
            mimeType: item.mime,
            size: item.size,
            thumbnail: null,
          }),
        })
      })

      return data
    })
  }

  async download({ id, providerUserSession }) {
    return this.withErrorHandling(
      'provider.webdav.download.error',
      async () => {
        const client = await this.getClient({ providerUserSession })
        /** @type {any} */
        const stat = await client.stat(id)
        const stream = client.createReadStream(`/${id}`)
        return { stream, size: stat.size }
      },
    )
  }

  async thumbnail({ id, providerUserSession }) {
    // not implementing this because a public thumbnail from webdav will be used instead
    logger.error(
      'call to thumbnail is not implemented',
      'provider.webdav.thumbnail.error',
    )
    throw new Error('call to thumbnail is not implemented')
  }

  async withErrorHandling(tag, fn) {
    try {
      return await fn()
    } catch (err) {
      let err2 = err
      if (err.status === 401) err2 = new ProviderAuthError()
      if (err.response) {
        err2 = new ProviderApiError('WebDAV API error', err.status)
      }
      logger.error(err2, tag)
      throw err2
    }
  }
}
