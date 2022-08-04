/**
 * SearchProvider interface defines the specifications of any Search provider implementation
 */
class SearchProvider {
  /**
   * list the files available based on the search query
   *
   * @param {object} options
   * @returns {Promise}
   */
  async list (options) { // eslint-disable-line no-unused-vars
    throw new Error('method not implemented')
  }

  /**
   * download a certain file from the provider files
   *
   * @param {object} options
   * @returns {Promise}
   */
  async download (options) { // eslint-disable-line no-unused-vars
    throw new Error('method not implemented')
  }

  /**
   * get the size of a certain file in the provider files
   *
   * @param {object} options
   * @returns {Promise}
   */
  async size (options) { // eslint-disable-line no-unused-vars
    throw new Error('method not implemented')
  }
}

module.exports = SearchProvider
