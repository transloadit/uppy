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
   * @param {Function} cb
   */
  list (options, cb) { // eslint-disable-line no-unused-vars
    throw new Error('method not implemented')
  }

  /**
   * download a certain file from the provider account
   *
   * @param {object} options
   * @param {Function} cb
   */
  download (options, cb) { // eslint-disable-line no-unused-vars
    throw new Error('method not implemented')
  }

  /**
   * return a thumbnail for a provider file
   *
   * @param {object} options
   * @param {Function} cb
   */
  thumbnail (options, cb) { // eslint-disable-line no-unused-vars
    throw new Error('method not implemented')
  }

  /**
   * get the size of a certain file in the provider account
   *
   * @param {object} options
   * @param {Function} cb
   */
  size (options, cb) { // eslint-disable-line no-unused-vars
    throw new Error('method not implemented')
  }

  /**
   * handle deauthorization notification from oauth providers
   *
   * @param {object} options
   * @param {Function} cb
   */
  deauthorizationCallback (options, cb) { // eslint-disable-line no-unused-vars
    // @todo consider doing something like cb(new NotImplementedError()) instead
    throw new Error('method not implemented')
  }

  /**
   * @returns {string}
   */
  static get authProvider () {
    return ''
  }
}

module.exports = Provider
