const request = require('request')
const purest = require('purest')({ request })
const { promisify } = require('util')

const Provider = require('../../Provider')
const { getURLMeta } = require('../../../helpers/request')
const logger = require('../../../logger')
const adapter = require('./adapter')
const { ProviderApiError, ProviderAuthError } = require('../../error')
const { requestStream } = require('../../../helpers/utils')

/**
 * Adapter for API https://developers.facebook.com/docs/instagram-api/overview
 */
class Instagram extends Provider {
  constructor (options) {
    super(options)
    this.authProvider = Instagram.authProvider
    this.client = purest({
      ...options,
      provider: Instagram.authProvider,
    })
  }

  static getExtraConfig () {
    return {
      protocol: 'https',
      scope: ['user_profile', 'user_media'],
    }
  }

  static get authProvider () {
    return 'instagram'
  }

  _list ({ directory, token, query = { cursor: null } }, done) {
    const qs = {
      fields: 'id,media_type,thumbnail_url,media_url,timestamp,children{media_type,media_url,thumbnail_url,timestamp}',
    }

    if (query.cursor) {
      qs.after = query.cursor
    }

    this.client
      .get('https://graph.instagram.com/me/media')
      .qs(qs)
      .auth(token)
      .request((err, resp, body) => {
        if (err || resp.statusCode !== 200) {
          err = this._error(err, resp)
          logger.error(err, 'provider.instagram.list.error')
          return done(err)
        }
        this._getUsername(token, (err, username) => {
          if (err) done(err)
          else done(null, this.adaptData(body, username, directory, query))
        })
      })
  }

  _getUsername (token, done) {
    this.client
      .get('https://graph.instagram.com/me')
      .qs({ fields: 'username' })
      .auth(token)
      .request((err, resp, body) => {
        if (err || resp.statusCode !== 200) {
          err = this._error(err, resp)
          logger.error(err, 'provider.instagram.user.error')
          return done(err)
        }
        done(null, body.username)
      })
  }

  async download ({ id, token }) {
    try {
      const body1 = await new Promise((resolve, reject) => (
        this.client
          .get(`https://graph.instagram.com/${id}`)
          .qs({ fields: 'media_url' })
          .auth(token)
          .request((err, resp, body) => {
            if (err || resp.statusCode !== 200) {
              err = this._error(err, resp)
              logger.error(err, 'provider.instagram.download.error')
              reject(err)
              return
            }
            resolve(body)
          })
      ))

      const req = request(body1.media_url)
      return await requestStream(req, async (res) => this._error(null, res))
    } catch (err) {
      logger.error(err, 'provider.instagram.download.url.error')
      throw err
    }
  }

  async thumbnail () {
    // not implementing this because a public thumbnail from instagram will be used instead
    logger.error('call to thumbnail is not implemented', 'provider.instagram.thumbnail.error')
    throw new Error('call to thumbnail is not implemented')
  }

  _size ({ id, token }, done) {
    return this.client
      .get(`https://graph.instagram.com/${id}`)
      .qs({ fields: 'media_url' })
      .auth(token)
      .request((err, resp, body) => {
        if (err || resp.statusCode !== 200) {
          err = this._error(err, resp)
          logger.error(err, 'provider.instagram.size.error')
          return done(err)
        }

        getURLMeta(body.media_url)
          .then(({ size }) => done(null, size))
          .catch((err2) => {
            logger.error(err2, 'provider.instagram.size.error')
            done(err2)
          })
      })
  }

  async logout () {
    // access revoke is not supported by Instagram's API
    return { revoked: false, manual_revoke_url: 'https://www.instagram.com/accounts/manage_access/' }
  }

  adaptData (res, username, directory, currentQuery) {
    const data = { username, items: [] }
    const items = adapter.getItemSubList(res)
    items.forEach((item, i) => {
      data.items.push({
        isFolder: adapter.isFolder(item),
        icon: adapter.getItemIcon(item),
        name: adapter.getItemName(item, i),
        mimeType: adapter.getMimeType(item),
        id: adapter.getItemId(item),
        size: null,
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

Instagram.version = 2

Instagram.prototype.list = promisify(Instagram.prototype._list)
Instagram.prototype.size = promisify(Instagram.prototype._size)

module.exports = Instagram
