const request = require('request')
const purest = require('purest')({ request })
const { promisify } = require('util')

const Provider = require('../Provider')
const { getURLMeta } = require('../../helpers/request')
const logger = require('../../logger')
const adapter = require('./adapter')
const { ProviderApiError, ProviderAuthError } = require('../error')
const { requestStream } = require('../../helpers/utils')

/**
 * Adapter for API https://developers.facebook.com/docs/graph-api/using-graph-api/
 */
class Facebook extends Provider {
  constructor (options) {
    super(options)
    this.authProvider = Facebook.authProvider
    this.client = purest({
      ...options,
      provider: Facebook.authProvider,
    })
  }

  static get authProvider () {
    return 'facebook'
  }

  _list ({ directory, token, query = { cursor: null } }, done) {
    const qs = {
      fields: 'name,cover_photo,created_time,type',
    }

    if (query.cursor) {
      qs.after = query.cursor
    }

    let path = 'me/albums'
    if (directory) {
      path = `${directory}/photos`
      qs.fields = 'icon,images,name,width,height,created_time'
    }

    this.client
      .get(`https://graph.facebook.com/${path}`)
      .qs(qs)
      .auth(token)
      .request((err, resp, body) => {
        if (err || resp.statusCode !== 200) {
          err = this._error(err, resp)
          logger.error(err, 'provider.facebook.list.error')
          return done(err)
        }
        this._getUsername(token, (err, username) => {
          if (err) {
            done(err)
          } else {
            done(null, this.adaptData(body, username, directory, query))
          }
        })
      })
  }

  _getUsername (token, done) {
    this.client
      .get('me')
      .qs({ fields: 'email' })
      .auth(token)
      .request((err, resp, body) => {
        if (err || resp.statusCode !== 200) {
          err = this._error(err, resp)
          logger.error(err, 'provider.facebook.user.error')
          return done(err)
        }
        done(null, body.email)
      })
  }

  _getMediaUrl (body) {
    const sortedImages = adapter.sortImages(body.images)
    return sortedImages[sortedImages.length - 1].source
  }

  async download ({ id, token }) {
    try {
      const body1 = await new Promise((resolve, reject) => (
        this.client
          .get(`https://graph.facebook.com/${id}`)
          .qs({ fields: 'images' })
          .auth(token)
          .request((err, resp, body) => {
            if (err || resp.statusCode !== 200) {
              err = this._error(err, resp)
              logger.error(err, 'provider.facebook.download.error')
              reject(err)
              return
            }
            resolve(body)
          })
      ))

      const url = this._getMediaUrl(body1)
      const req = request(url)
      return await requestStream(req, async (res) => this._error(null, res))
    } catch (err) {
      logger.error(err, 'provider.facebook.download.url.error')
      throw err
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async thumbnail () {
    // not implementing this because a public thumbnail from facebook will be used instead
    logger.error('call to thumbnail is not implemented', 'provider.facebook.thumbnail.error')
    throw new Error('call to thumbnail is not implemented')
  }

  _size ({ id, token }, done) {
    return this.client
      .get(`https://graph.facebook.com/${id}`)
      .qs({ fields: 'images' })
      .auth(token)
      .request((err, resp, body) => {
        if (err || resp.statusCode !== 200) {
          err = this._error(err, resp)
          logger.error(err, 'provider.facebook.size.error')
          return done(err)
        }

        getURLMeta(this._getMediaUrl(body))
          .then(({ size }) => done(null, size))
          .catch((err2) => {
            logger.error(err2, 'provider.facebook.size.error')
            done(err2)
          })
      })
  }

  _logout ({ token }, done) {
    return this.client
      .delete('me/permissions')
      .auth(token)
      .request((err, resp) => {
        if (err || resp.statusCode !== 200) {
          logger.error(err, 'provider.facebook.logout.error')
          done(this._error(err, resp))
          return
        }
        done(null, { revoked: true })
      })
  }

  adaptData (res, username, directory, currentQuery) {
    const data = { username, items: [] }
    const items = adapter.getItemSubList(res)
    items.forEach((item) => {
      data.items.push({
        isFolder: adapter.isFolder(item),
        icon: adapter.getItemIcon(item),
        name: adapter.getItemName(item),
        mimeType: adapter.getMimeType(item),
        size: null,
        id: adapter.getItemId(item),
        thumbnail: adapter.getItemThumbnailUrl(item),
        requestPath: adapter.getItemRequestPath(item),
        modifiedDate: adapter.getItemModifiedDate(item),
      })
    })

    data.nextPagePath = adapter.getNextPagePath(res, currentQuery, directory)
    return data
  }

  _error (err, resp) {
    if (resp) {
      if (resp.body && resp.body.error.code === 190) {
        // Invalid OAuth 2.0 Access Token
        return new ProviderAuthError()
      }

      const fallbackMessage = `request to ${this.authProvider} returned ${resp.statusCode}`
      const msg = resp.body && resp.body.error ? resp.body.error.message : fallbackMessage
      return new ProviderApiError(msg, resp.statusCode)
    }

    return err
  }
}

Facebook.version = 2

Facebook.prototype.list = promisify(Facebook.prototype._list)
Facebook.prototype.size = promisify(Facebook.prototype._size)
Facebook.prototype.logout = promisify(Facebook.prototype._logout)

module.exports = Facebook
