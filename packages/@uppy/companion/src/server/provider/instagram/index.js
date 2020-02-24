const Provider = require('../Provider')

const request = require('request')
const purest = require('purest')({ request })
const utils = require('../../helpers/utils')
const logger = require('../../logger')
const adapter = require('./adapter')
const { ProviderApiError, ProviderAuthError } = require('../error')

/**
 * Adapter for API https://www.instagram.com/developer/endpoints/
 */
class Instagram extends Provider {
  constructor (options) {
    super(options)
    this.authProvider = options.provider = Instagram.authProvider
    this.client = purest(options)
  }

  static get authProvider () {
    return 'instagram'
  }

  list ({ directory = 'recent', token, query = {} }, done) {
    const cursor = query.cursor || query.max_id
    const qs = cursor ? { max_id: cursor } : {}
    this.client
      .get(`users/self/media/${directory}`)
      .qs(qs)
      .auth(token)
      .request((err, resp, body) => {
        if (err || resp.statusCode !== 200) {
          err = this._error(err, resp)
          logger.error(err, 'provider.instagram.list.error')
          return done(err)
        } else {
          this._getUsername(token, (err, username) => {
            err ? done(err) : done(null, this.adaptData(body, username))
          })
        }
      })
  }

  _getUsername (token, done) {
    this.client
      .get('users/self')
      .auth(token)
      .request((err, resp, body) => {
        if (err || resp.statusCode !== 200) {
          err = this._error(err, resp)
          logger.error(err, 'provider.instagram.user.error')
          return done(err)
        } else {
          done(null, body.data.username)
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

  thumbnail (_, done) {
    // not implementing this because a public thumbnail from instagram will be used instead
    const err = new Error('call to thumbnail is not implemented')
    logger.error(err, 'provider.instagram.thumbnail.error')
    return done(err)
  }

  size ({ id, token, query = {} }, done) {
    return this.client
      .get(`media/${id}`)
      .auth(token)
      .request((err, resp, body) => {
        if (err || resp.statusCode !== 200) {
          err = this._error(err, resp)
          logger.error(err, 'provider.instagram.size.error')
          return done(err)
        }

        utils.getURLMeta(this._getMediaUrl(body, query.carousel_id))
          .then(({ size }) => done(null, size))
          .catch((err) => {
            logger.error(err, 'provider.instagram.size.error')
            done()
          })
      })
  }

  logout (_, done) {
    // access revoke is not supported by Instagram's API
    done(null, { revoked: false, manual_revoke_url: 'https://www.instagram.com/accounts/manage_access/' })
  }

  adaptData (res, username) {
    const data = { username: username, items: [] }
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

    data.nextPagePath = adapter.getNextPagePath(res)
    return data
  }

  _error (err, resp) {
    if (resp) {
      if (resp.statusCode === 400 && resp.body && resp.body.meta.error_type === 'OAuthAccessTokenException') {
        return new ProviderAuthError()
      }

      const msg = `request to ${this.authProvider} returned ${resp.statusCode}`
      return new ProviderApiError(msg, resp.statusCode)
    }

    return err
  }
}

module.exports = Instagram
