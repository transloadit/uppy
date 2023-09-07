const { validateURL } = require('../../helpers/request')
const WebdavProvider = require('./common')
const { ProviderUserError } = require('../error')
const logger = require('../../logger')

const defaultDirectory = '/'

/**
 * Adapter for WebDAV servers that support simple auth (non-OAuth).
 */
class WebdavSimpleAuthProvider extends WebdavProvider {
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

    const [baseURL, publicLinkToken] = webdavUrl.split('/s/')
    const { AuthType } = await import('webdav') // eslint-disable-line import/no-unresolved
    return this.getClientHelper({
      url: baseURL.replace(/^\/index.php/, '/public.php/webdav/'),
      authType: AuthType.Password,
      username: publicLinkToken,
      password: 'null',
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
      logger.error(err, 'provider.webdav.simpleAuth.error')
      if (['ECONNREFUSED', 'ENOTFOUND'].includes(err.code)) {
        throw new ProviderUserError({ message: 'Cannot connect to server' })
      }
      // todo report back to the user what actually went wrong
      throw err
    }
  }
}

module.exports = WebdavSimpleAuthProvider
