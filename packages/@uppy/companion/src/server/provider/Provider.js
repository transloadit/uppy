const { MAX_AGE_24H } = require('../helpers/jwt')

/**
 * Provider interface defines the specifications of any provider implementation
 */
class Provider {
  /**
   *
   * @param {{providerName: string, allowLocalUrls: boolean, providerGrantConfig?: object}} options
   */
  constructor ({ allowLocalUrls, providerGrantConfig }) {
    // Some providers might need cookie auth for the thumbnails fetched via companion
    this.needsCookieAuth = false
    this.allowLocalUrls = allowLocalUrls
    this.providerGrantConfig = providerGrantConfig
    return this
  }

  /**
   * config to extend the grant config
   * todo major: rename to getExtraGrantConfig
   */
  static getExtraConfig () {
    return {}
  }

  /**
   * list the files and folders in the provider account
   *
   * @param {object} options
   * @returns {Promise}
   */
  // eslint-disable-next-line class-methods-use-this,no-unused-vars
  async list (options) {
    throw new Error('method not implemented')
  }

  /**
   * download a certain file from the provider account
   *
   * @param {object} options
   * @returns {Promise}
   */
  // eslint-disable-next-line class-methods-use-this,no-unused-vars
  async download (options) {
    throw new Error('method not implemented')
  }

  /**
   * return a thumbnail for a provider file
   *
   * @param {object} options
   * @returns {Promise}
   */
  // eslint-disable-next-line class-methods-use-this,no-unused-vars
  async thumbnail (options) {
    throw new Error('method not implemented')
  }

  /**
   * get the size of a certain file in the provider account
   *
   * @param {object} options
   * @returns {Promise}
   */
  // eslint-disable-next-line class-methods-use-this,no-unused-vars
  async size (options) {
    throw new Error('method not implemented')
  }

  /**
   * handle deauthorization notification from oauth providers
   *
   * @param {object} options
   * @returns {Promise}
   */
  // eslint-disable-next-line class-methods-use-this,no-unused-vars
  async deauthorizationCallback (options) {
    // @todo consider doing something like throw new NotImplementedError() instead
    throw new Error('method not implemented')
  }

  /**
   * Generate a new access token based on the refresh token
   */
  // eslint-disable-next-line class-methods-use-this,no-unused-vars
  async refreshToken (options) {
    throw new Error('method not implemented')
  }

  /**
   * @param {any} param0
   * @returns {Promise<any>}
   */
  // eslint-disable-next-line no-unused-vars, class-methods-use-this
  async simpleAuth ({ requestBody }) {
    throw new Error('method not implemented')
  }

  /**
   * Name of the OAuth provider (passed to Grant). Return empty string if no OAuth provider is needed.
   *
   * @returns {string}
   */
  // todo next major: rename authProvider to oauthProvider (we have other non-oauth auth types too now)
  static get authProvider () {
    return undefined
  }

  // eslint-disable-next-line no-unused-vars
  static grantDynamicToUserSession ({ grantDynamic }) {
    return {}
  }

  static get hasSimpleAuth () {
    return false
  }

  static get authStateExpiry () {
    return MAX_AGE_24H
  }
}

module.exports = Provider
// OAuth providers are those that have an `authProvider` set. It means they require OAuth authentication to work
module.exports.isOAuthProvider = (authProvider) => typeof authProvider === 'string' && authProvider.length > 0
