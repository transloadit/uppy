const SearchProvider = require('../SearchProvider')
const request = require('request')
const utils = require('../../helpers/utils')
const logger = require('../../logger')
const adapter = require('./adapter')
const { ProviderApiError } = require('../error')
const BASE_URL = 'https://api.unsplash.com'

/**
 * Adapter for API https://api.unsplash.com
 */
class Unsplash extends SearchProvider {
  list ({ token, query = { cursor: null, q: null } }, done) {
    const reqOpts = {
      url: `${BASE_URL}/search/photos`,
      method: 'GET',
      json: true,
      qs: {
        per_page: 40,
        query: query.q
      },
      headers: {
        Authorization: `Client-ID ${token}`
      }
    }

    if (query.cursor) {
      reqOpts.qs.page = query.cursor
    }

    request(reqOpts, (err, resp, body) => {
      if (err || resp.statusCode !== 200) {
        err = this._error(err, resp)
        logger.error(err, 'provider.unsplash.list.error')
        return done(err)
      } else {
        done(null, this.adaptData(body, query))
      }
    })
  }

  download ({ id, token }, onData) {
    const reqOpts = {
      url: `${BASE_URL}/photos/${id}`,
      method: 'GET',
      json: true,
      headers: {
        Authorization: `Client-ID ${token}`
      }
    }

    request(reqOpts, (err, resp, body) => {
      if (err || resp.statusCode !== 200) {
        err = this._error(err, resp)
        logger.error(err, 'provider.unsplash.download.error')
        onData(err)
        return
      }

      const url = body.links.download
      request.get(url)
        .on('response', (resp) => {
          if (resp.statusCode !== 200) {
            onData(this._error(null, resp))
          } else {
            resp.on('data', (chunk) => onData(null, chunk))
          }
        })
        .on('end', () => onData(null, null))
        .on('error', (err) => {
          logger.error(err, 'provider.unsplash.download.url.error')
          onData(err)
        })
    })
  }

  size ({ id, token }, done) {
    const reqOpts = {
      url: `${BASE_URL}/photos/${id}`,
      method: 'GET',
      json: true,
      headers: {
        Authorization: `Client-ID ${token}`
      }
    }

    request(reqOpts, (err, resp, body) => {
      if (err || resp.statusCode !== 200) {
        err = this._error(err, resp)
        logger.error(err, 'provider.unsplash.size.error')
        done(err)
        return
      }

      utils.getURLMeta(body.links.download)
        .then(({ size }) => done(null, size))
        .catch((err) => {
          logger.error(err, 'provider.unsplash.size.error')
          done()
        })
    })
  }

  adaptData (body, currentQuery) {
    const data = { username: null, items: [] }
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
        size: null
      })
    })

    const pagesCount = body.total_pages
    const currentPage = parseInt(currentQuery.cursor || 1)
    const hasNextPage = currentPage < pagesCount
    data.nextPagePath = hasNextPage ? adapter.getNextPagePath(currentQuery) : null
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

module.exports = Unsplash
