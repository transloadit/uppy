const request = require('request')
const SearchProvider = require('../SearchProvider')
const { getURLMeta } = require('../../helpers/request')
const logger = require('../../logger')
const adapter = require('./adapter')
const { ProviderApiError } = require('../error')

const BASE_URL = 'https://api.unsplash.com'

function adaptData (body, currentQuery) {
  const pagesCount = body.total_pages
  const currentPage = Number(currentQuery.cursor || 1)
  const hasNextPage = currentPage < pagesCount
  const subList = adapter.getItemSubList(body) || []

  return {
    searchedFor: currentQuery.q,
    username: null,
    items: subList.map((item) => ({
      isFolder: adapter.isFolder(item),
      icon: adapter.getItemIcon(item),
      name: adapter.getItemName(item),
      mimeType: adapter.getMimeType(item),
      id: adapter.getItemId(item),
      thumbnail: adapter.getItemThumbnailUrl(item),
      requestPath: adapter.getItemRequestPath(item),
      modifiedDate: adapter.getItemModifiedDate(item),
      author: adapter.getAuthor(item),
      size: null,
    })),
    nextPageQuery: hasNextPage
      ? adapter.getNextPageQuery(currentQuery)
      : null,
  }
}

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
        const error = this.error(err, resp)
        logger.error(error, 'provider.unsplash.list.error')
        return done(error)
      }
      return done(null, adaptData(body, query))
    })
  }

  download ({ id, token }, onData) {
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
        const error = this.error(err, resp)
        logger.error(error, 'provider.unsplash.download.error')
        onData(error)
        return
      }

      const url = body.links.download

      request
        .get(url)
        .on('response', (response) => {
          if (response.statusCode !== 200) {
            onData(this.error(null, response))
          } else {
            response.on('data', (chunk) => onData(null, chunk))
          }
        })
        .on('end', () => onData(null, null))
        // To attribute the author of the image, we call the `download_location`
        // endpoint to increment the download count on Unsplash.
        // https://help.unsplash.com/en/articles/2511258-guideline-triggering-a-download
        .on('complete', () => request({ ...reqOpts, url: body.links.download_location }))
        .on('error', (error) => {
          logger.error(error, 'provider.unsplash.download.url.error')
          onData(error)
        })
    })
  }

  size ({ id, token }, done) {
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
        const error = this.error(err, resp)
        logger.error(error, 'provider.unsplash.size.error')
        done(error)
        return
      }

      getURLMeta(body.links.download)
        .then(({ size }) => done(null, size))
        .catch((error) => {
          logger.error(error, 'provider.unsplash.size.error')
          done()
        })
    })
  }

  // eslint-disable-next-line class-methods-use-this
  error (err, resp) {
    if (resp) {
      const fallbackMessage = `request to Unsplash returned ${resp.statusCode}`
      const msg
        = resp.body && resp.body.errors ? `${resp.body.errors}` : fallbackMessage
      return new ProviderApiError(msg, resp.statusCode)
    }

    return err
  }
}

module.exports = Unsplash
