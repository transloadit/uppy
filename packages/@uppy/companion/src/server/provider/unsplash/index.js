const request = require('request')
const { promisify } = require('util')

const SearchProvider = require('../SearchProvider')
const { getURLMeta } = require('../../helpers/request')
const logger = require('../../logger')
const adapter = require('./adapter')
const { ProviderApiError } = require('../error')
const { requestStream } = require('../../helpers/utils')

const BASE_URL = 'https://api.unsplash.com'

/**
 * Adapter for API https://api.unsplash.com
 */
class Unsplash extends SearchProvider {
  async list (options) {
    return promisify(this._list.bind(this))(options)
  }

  _list ({ token, query = { cursor: null, q: null } }, done) {
    const reqOpts = {
      url: `${BASE_URL}/search/photos`,
      method: 'GET',
      json: true,
      qs: {
        per_page: 40,
        query: query.q,
      },
      headers: {
        Authorization: `Client-ID ${token}`,
      },
    }

    if (query.cursor) {
      reqOpts.qs.page = query.cursor
    }

    request(reqOpts, (err, resp, body) => {
      if (err || resp.statusCode !== 200) {
        err = this._error(err, resp)
        logger.error(err, 'provider.unsplash.list.error')
        return done(err)
      }
      done(null, this.adaptData(body, query))
    })
  }

  async download ({ id, token }) {
    try {
      const reqOpts = {
        url: `${BASE_URL}/photos/${id}`,
        method: 'GET',
        json: true,
        headers: {
          Authorization: `Client-ID ${token}`,
        },
      }

      const url = await new Promise((resolve, reject) => (
        request(reqOpts, (err, resp, body) => {
          if (err || resp.statusCode !== 200) {
            err = this._error(err, resp)
            logger.error(err, 'provider.unsplash.download.error')
            reject(err)
            return
          }
          resolve(body.links.download)
        })
      ))

      const req = request.get(url)
      return await requestStream(req, async (res) => this._error(null, res))
    } catch (err) {
      logger.error(err, 'provider.unsplash.download.url.error')
      throw err
    }
  }

  async size (options) {
    return promisify(this._size.bind(this))(options)
  }

  _size ({ id, token }, done) {
    const reqOpts = {
      url: `${BASE_URL}/photos/${id}`,
      method: 'GET',
      json: true,
      headers: {
        Authorization: `Client-ID ${token}`,
      },
    }

    request(reqOpts, (err, resp, body) => {
      if (err || resp.statusCode !== 200) {
        err = this._error(err, resp)
        logger.error(err, 'provider.unsplash.size.error')
        done(err)
        return
      }

      getURLMeta(body.links.download)
        .then(({ size }) => done(null, size))
        .catch((err2) => {
          logger.error(err2, 'provider.unsplash.size.error')
          done(err2)
        })
    })
  }

  adaptData (body, currentQuery) {
    const data = {
      searchedFor: currentQuery.q,
      username: null,
      items: [],
    }
    const items = adapter.getItemSubList(body)
    items.forEach((item) => {
      data.items.push({
        isFolder: adapter.isFolder(item),
        icon: adapter.getItemIcon(item),
        name: adapter.getItemName(item),
        mimeType: adapter.getMimeType(item),
        id: adapter.getItemId(item),
        thumbnail: adapter.getItemThumbnailUrl(item),
        requestPath: adapter.getItemRequestPath(item),
        modifiedDate: adapter.getItemModifiedDate(item),
        size: null,
      })
    })

    const pagesCount = body.total_pages
    const currentPage = parseInt(currentQuery.cursor || 1)
    const hasNextPage = currentPage < pagesCount
    data.nextPageQuery = hasNextPage ? adapter.getNextPageQuery(currentQuery) : null
    return data
  }

  _error (err, resp) {
    if (resp) {
      const fallbackMessage = `request to Unsplash returned ${resp.statusCode}`
      const msg = resp.body && resp.body.errors ? `${resp.body.errors}` : fallbackMessage
      return new ProviderApiError(msg, resp.statusCode)
    }

    return err
  }
}

Unsplash.version = 2

module.exports = Unsplash
