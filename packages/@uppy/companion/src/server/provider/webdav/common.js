const Provider = require('../Provider')
const logger = require('../../logger')
const { getProtectedHttpAgent, validateURL } = require('../../helpers/request')
const { ProviderApiError, ProviderAuthError } = require('../error')

/**
 * WebdavProvider base class provides implementations shared by simple and oauth providers
 */
class WebdavProvider extends Provider {
  async getClientHelper ({ url, ...options }) {
    const { allowLocalUrls } = this
    if (!validateURL(url, allowLocalUrls)) {
      throw new Error('invalid webdav url')
    }
    const { protocol } = new URL(url)
    const HttpAgentClass = getProtectedHttpAgent({ protocol, blockLocalIPs: !allowLocalUrls })

    const { createClient } = await import('webdav') // eslint-disable-line import/no-unresolved
    return createClient(url, {
      ...options,
      [`${protocol}Agent`] : new HttpAgentClass(),
    })
  }

  async getClient ({ username, token, providerUserSession }) { // eslint-disable-line no-unused-vars,class-methods-use-this
    logger.error('call to getUsername is not implemented', 'provider.webdav.getUsername.error')
    throw new Error('call to getUsername is not implemented')
    // todo: use @returns to specify the return type
    return this.getClientHelper() // eslint-disable-line
  }

  async getUsername ({ token, providerUserSession }) { // eslint-disable-line no-unused-vars,class-methods-use-this
    logger.error('call to getUsername is not implemented', 'provider.webdav.getUsername.error')
    throw new Error('call to getUsername is not implemented')
  }

  /** @protected */
  // eslint-disable-next-line class-methods-use-this
  isAuthenticated () {
    throw new Error('Not implemented')
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
          requestPath, // TODO
          modifiedDate: item.lastmod, // TODO: convert  'Tue, 04 Jul 2023 13:09:47 GMT' to  ISO 8601
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

  // todo implement
  // eslint-disable-next-line
  async size ({ id, providerUserSession }) {
    return this.withErrorHandling('provider.webdav.size.error', async () => {
      return 0
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
