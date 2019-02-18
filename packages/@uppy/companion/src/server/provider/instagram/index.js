const request = require('request')
const purest = require('purest')({ request })
const utils = require('../../helpers/utils')
const logger = require('../../logger')
const adapter = require('./adapter')
const AuthError = require('../error')

class Instagram {
  constructor (options) {
    this.authProvider = options.provider = Instagram.authProvider
    this.client = purest(options)
  }

  static get authProvider () {
    return 'instagram'
  }

  list ({ directory = 'recent', token, query = {} }, done) {
    const qs = query.max_id ? {max_id: query.max_id} : {}
    this.client
      .select(`users/self/media/${directory}`)
      .qs(qs)
      .auth(token)
      .request((err, resp, body) => {
        if (err) {
          done(err)
        } else if (resp.statusCode !== 200) {
          done(this._error(resp))
        } else {
          done(null, this.adaptData(body))
        }
      })
  }

  _getMediaUrl (body, carouselId) {
    let mediaObj
    let type

    if (body.data.type === 'carousel') {
      carouselId = carouselId ? parseInt(carouselId) : 0
      mediaObj = body.data.carousel_media[carouselId]
      type = mediaObj.type
    } else {
      mediaObj = body.data
      type = body.data.type
    }

    return mediaObj[`${type}s`].standard_resolution.url
  }

  download ({ id, token, query = {} }, onData) {
    return this.client
      .get(`media/${id}`)
      .auth(token)
      .request((err, resp, body) => {
        if (err) return logger.error(err, 'provider.instagram.download.error')
        request(this._getMediaUrl(body, query.carousel_id))
          .on('data', onData)
          .on('end', () => onData(null))
          .on('error', (err) => {
            logger.error(err, 'provider.instagram.download.url.error')
          })
      })
  }

  thumbnail ({id, token}, done) {
    return this.client
      .get(`media/${id}`)
      .auth(token)
      .request((err, resp, body) => {
        if (err) return logger.error(err, 'provider.instagram.thumbnail.error')

        request(body.data.images.thumbnail.url)
          .on('response', (resp) => {
            if (resp.statusCode !== 200) {
              return done(this._error(resp))
            }
            done(null, resp)
          })
          .on('error', (err) => {
            logger.error(err, 'provider.instagram.thumbnail.error')
          })
      })
  }

  size ({id, token, query = {}}, done) {
    return this.client
      .get(`media/${id}`)
      .auth(token)
      .request((err, resp, body) => {
        if (err) {
          logger.error(err, 'provider.instagram.size.error')
          return done()
        }

        if (resp.statusCode !== 200) {
          return done(this._error(resp))
        }

        utils.getURLMeta(this._getMediaUrl(body, query.carousel_id))
          .then(({ size }) => done(null, size))
          .catch((err) => {
            logger.error(err, 'provider.instagram.size.error')
            done()
          })
      })
  }

  adaptData (res) {
    const data = { username: adapter.getUsername(res), items: [] }
    const items = adapter.getItemSubList(res)
    items.forEach((item) => {
      data.items.push({
        isFolder: adapter.isFolder(item),
        icon: adapter.getItemIcon(item),
        name: adapter.getItemName(item),
        mimeType: adapter.getMimeType(item),
        id: adapter.getItemId(item),
        thumbnail: adapter.getItemThumbnailUrl(item),
        requestPath: adapter.getItemRequestPath(item),
        modifiedDate: adapter.getItemModifiedDate(item)
      })
    })

    data.nextPagePath = adapter.getNextPagePath(items)
    return data
  }

  _error (resp) {
    if (resp.statusCode === 400 && resp.body && resp.body.meta.error_type === 'OAuthAccessTokenException') {
      return new AuthError()
    }

    return new Error(`request to ${this.authProvider} returned ${resp.statusCode}`)
  }
}

module.exports = Instagram
