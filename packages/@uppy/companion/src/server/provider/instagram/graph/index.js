const Provider = require('../../Provider')

const request = require('request')
const purest = require('purest')({ request })
const utils = require('../../../helpers/utils')
const logger = require('../../../logger')
const adapter = require('./adapter')
const AuthError = require('../../error')

class Instagram extends Provider {
  constructor (options) {
    super(options)
    this.authProvider = options.provider = Instagram.authProvider
    this.client = purest(options)
  }

  static getExtraConfig () {
    return {
      protocol: 'https',
      scope: ['user_profile', 'user_media']
    }
  }

  static get authProvider () {
    return 'instagram'
  }

  list ({ directory, token, query = {} }, done) {
    const qs = {
      fields: 'id,media_type,thumbnail_url,media_url,timestamp,children{media_type,media_url,thumbnail_url,timestamp}'
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
        } else {
          this._getUsername(token, (err, username) => {
            err ? done(err) : done(null, this.adaptData(body, username, directory, query))
          })
        }
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
        } else {
          done(null, body.username)
        }
      })
  }

  download ({ id, token }, onData) {
    return this.client
      .get(`https://graph.instagram.com/${id}`)
      .qs({ fields: 'media_url' })
      .auth(token)
      .request((err, resp, body) => {
        if (err) return logger.error(err, 'provider.instagram.download.error')
        request(body.media_url)
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

  size ({ id, token }, done) {
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

        utils.getURLMeta(body.media_url)
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

  adaptData (res, username, directory, currentQuery) {
    const data = { username: username, items: [] }
    const items = adapter.getItemSubList(res)
    items.forEach((item, i) => {
      data.items.push({
        isFolder: adapter.isFolder(item),
        icon: adapter.getItemIcon(item),
        name: adapter.getItemName(item, i),
        mimeType: adapter.getMimeType(item),
        id: adapter.getItemId(item),
        thumbnail: adapter.getItemThumbnailUrl(item),
        requestPath: adapter.getItemRequestPath(item),
        modifiedDate: adapter.getItemModifiedDate(item)
      })
    })

    data.nextPagePath = adapter.getNextPagePath(res, currentQuery, directory)
    return data
  }

  _error (err, resp) {
    if (resp) {
      if (resp.body && resp.body.error.code === 190) {
        // Invalid OAuth 2.0 Access Token
        return new AuthError()
      }

      const msg = resp.body && resp.body.error ? resp.body.error.message : ''
      return new Error(`request to ${this.authProvider} returned status: ${resp.statusCode}, message: ${msg}`)
    }

    return err
  }
}

module.exports = Instagram
