/**
 * Provider interface defines the specifications of any provider implementation
 */
class Provider {
  /**
   *
   * @param {object} options
   */
  constructor (options) {
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
   * @param {object} options
   * @param {function} cb
   */
  list (options, cb) {
    throw new Error('method not implemented')
  }

  /**
   * download a certain file from the provider account
   * @param {object} options
   * @param {function} cb
   */
  download (options, cb) {
    throw new Error('method not implemented')
  }

  /**
   * return a thumbnail for a provider file
   * @param {object} options
   * @param {function} cb
   */
  thumbnail (options, cb) {
    throw new Error('method not implemented')
  }

  /**
   * get the size of a certain file in the provider account
   * @param {object} options
   * @param {function} cb
   */
  size (options, cb) {
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
