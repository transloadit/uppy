
const Provider = require('../Provider')
const { getProtectedHttpAgent, validateURL } = require('../../helpers/request')
const { ProviderApiError, ProviderAuthError } = require('../error')
const { ProviderUserError } = require('../error')
const logger = require('../../logger')

const defaultDirectory = '/'

/**
 * Adapter for WebDAV servers that support simple auth (non-OAuth).
 */
class WebdavProvider extends Provider {
  static get hasSimpleAuth () {
    return true
  }

  async getUsername () { // eslint-disable-line class-methods-use-this
    return null
  }

  // eslint-disable-next-line class-methods-use-this
  isAuthenticated ({ providerUserSession }) {
    return providerUserSession.webdavUrl != null
  }

  async getClient ({ providerUserSession }) {
    const webdavUrl = providerUserSession?.webdavUrl
    const { allowLocalUrls } = this
    if (!validateURL(webdavUrl, allowLocalUrls)) {
      throw new Error('invalid public link url')
    }

    // dynamic import because Comanion currently uses CommonJS and webdav is shipped as ESM
    // can be implemented as regular require as soon as Node 20.17 or 22 is required
    // or as regular import when Companion is ported to ESM
    const { AuthType } = await import('webdav') // eslint-disable-line import/no-unresolved

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

  async logout () { // eslint-disable-line class-methods-use-this
    return { revoked: true }
  }

  async simpleAuth ({ requestBody }) {
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
      // todo report back to the user what actually went wrong
      throw err
    }
  }

  async getClientHelper ({ url, ...options }) {
    const { allowLocalUrls } = this
    if (!validateURL(url, allowLocalUrls)) {
      throw new Error('invalid webdav url')
    }
    const { protocol } = new URL(url)
    const HttpAgentClass = getProtectedHttpAgent({ protocol, allowLocalIPs: !allowLocalUrls })

    // dynamic import because Comanion currently uses CommonJS and webdav is shipped as ESM
    // can be implemented as regular require as soon as Node 20.17 or 22 is required
    // or as regular import when Companion is ported to ESM
    const { createClient } = await import('webdav')
    return createClient(url, {
      ...options,
      [`${protocol}Agent`] : new HttpAgentClass(),
    })
  }

  async list ({ directory, token, providerUserSession }) {
    return this.withErrorHandling('provider.webdav.list.error', async () => {
      // @ts-ignore
      if (!this.isAuthenticated({ providerUserSession })) {
        throw new ProviderAuthError()
      }

      const username = await this.getUsername({ token, providerUserSession })
      const data = { username, items: [] }
      const client = await this.getClient({ username, token, providerUserSession })

      /** @type {any} */
      const dir = await client.getDirectoryContents(directory || '/')

      dir.forEach(item => {
        const isFolder = item.type === 'directory'
        const requestPath = encodeURIComponent(`${directory || ''}/${item.basename}`)
        data.items.push({
          isFolder,
          id: requestPath,
          name: item.basename,
          requestPath, // TODO FIXME
          modifiedDate: item.lastmod, // TODO FIXME: convert  'Tue, 04 Jul 2023 13:09:47 GMT' to  ISO 8601
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

  async download ({ id, token, providerUserSession }) {
    return this.withErrorHandling('provider.webdav.download.error', async () => {
      // maybe we can avoid this by putting the username in front of the request path/id
      const username = await this.getUsername({ token, providerUserSession })
      const client = await this.getClient({ username, token, providerUserSession })
      const stream = client.createReadStream(`/${id}`)
      return { stream }
    })
  }

  // eslint-disable-next-line
  async thumbnail ({ id, providerUserSession }) {
    // not implementing this because a public thumbnail from webdav will be used instead
    logger.error('call to thumbnail is not implemented', 'provider.webdav.thumbnail.error')
    throw new Error('call to thumbnail is not implemented')
  }

  // todo fixme implement
  // eslint-disable-next-line
  async size ({ id, token, providerUserSession }) {
    return this.withErrorHandling('provider.webdav.size.error', async () => {
      const username = await this.getUsername({ token, providerUserSession })
      const client = await this.getClient({ username, token, providerUserSession })

      /** @type {any} */
      const stat = await client.stat(id)
      return stat.size
    })
  }

  // eslint-disable-next-line class-methods-use-this
  async withErrorHandling (tag, fn) {
    try {
      return await fn()
    } catch (err) {
      let err2 = err
      if (err.status === 401) err2 = new ProviderAuthError()
      if (err.response) {
        err2 = new ProviderApiError('WebDAV API error', err.status) // todo improve (read err?.response?.body readable stream and parse response)
      }
      logger.error(err2, tag)
      throw err2
    }
  }
}

module.exports = WebdavProvider
