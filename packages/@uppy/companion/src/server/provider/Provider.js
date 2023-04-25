/**
 * Provider interface defines the specifications of any provider implementation
 */
class Provider {
  /**
   *
   * @param {object} options
   */
  constructor (options) { // eslint-disable-line no-unused-vars
    this.needsCookieAuth = false
    return this
  }

  /**
   * config to extend the grant config
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
   * Name of the OAuth provider. Return empty string if no OAuth provider is needed.
   *
   * @returns {string}
   */
  static get authProvider () {
    return undefined
  }
}

module.exports = Provider
// OAuth providers are those that have a `static authProvider` set. It means they require OAuth authentication to work
module.exports.isOAuthProvider = (authProvider) => typeof authProvider === 'string' && authProvider.length > 0
