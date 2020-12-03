const Provider = require('../Provider')

const request = require('request')
const purest = require('purest')({ request })
const logger = require('../../logger')
const adapter = require('./adapter')
const { ProviderApiError, ProviderAuthError } = require('../error')

const BOX_FILES_FIELDS = 'id,modified_at,name,permissions,size,type'
const BOX_THUMBNAIL_SIZE = 256

/**
 * Adapter for API https://developer.box.com/reference/
 */
class Box extends Provider {
  constructor (options) {
    super(options)
    this.authProvider = options.provider = Box.authProvider
    this.client = purest(options)
    // needed for the thumbnails fetched via companion
    this.needsCookieAuth = true
  }

  static get authProvider () {
    return 'box'
  }

  _userInfo ({ token }, done) {
    this.client
      .get('users/me')
      .auth(token)
      .request(done)
  }

  /**
   * Lists files and folders from Box API
   *
   * @param {object} options
   * @param {function} done
   */
  list ({ directory, token, query, companion }, done) {
    const rootFolderID = '0'
    const path = `folders/${directory || rootFolderID}/items`

    this.client
      .get(path)
      .qs({ fields: BOX_FILES_FIELDS, offset: query.cursor })
      .auth(token)
      .request((err, resp, body) => {
        if (err || resp.statusCode !== 200) {
          err = this._error(err, resp)
          logger.error(err, 'provider.box.list.error')
          return done(err)
        } else {
          this._userInfo({ token }, (err, infoResp) => {
            if (err || infoResp.statusCode !== 200) {
              err = this._error(err, infoResp)
              logger.error(err, 'provider.token.user.error')
              return done(err)
            }
            done(null, this.adaptData(body, infoResp.body.login, companion))
          })
        }
      })
  }

  download ({ id, token }, onData) {
    return this.client
      .get(`files/${id}/content`)
      .auth(token)
      .request()
      .on('response', (resp) => {
        if (resp.statusCode !== 200) {
          onData(this._error(null, resp))
        } else {
          resp.on('data', (chunk) => onData(null, chunk))
        }
      })
      .on('end', () => onData(null, null))
      .on('error', (err) => {
        logger.error(err, 'provider.box.download.error')
        onData(err)
      })
  }

  thumbnail ({ id, token }, done) {
    return this.client
      .get(`files/${id}/thumbnail.png`)
      .qs({ max_height: BOX_THUMBNAIL_SIZE, max_width: BOX_THUMBNAIL_SIZE })
      .auth(token)
      .request()
      .on('response', (resp) => {
        // box generates a thumbnail on first request
        // so they return a placeholder in the header while that's happening
        if (resp.statusCode === 202 && resp.headers.location) {
          return this.client.get(resp.headers.location)
            .request()
            .on('response', (placeholderResp) => {
              if (placeholderResp.statusCode !== 200) {
                const err = this._error(null, placeholderResp)
                logger.error(err, 'provider.box.thumbnail.error')
                return done(err)
              }

              done(null, placeholderResp)
            })
        }

        if (resp.statusCode !== 200) {
          const err = this._error(null, resp)
          logger.error(err, 'provider.box.thumbnail.error')
          return done(err)
        }
        done(null, resp)
      })
      .on('error', (err) => {
        logger.error(err, 'provider.box.thumbnail.error')
      })
  }

  size ({ id, token }, done) {
    return this.client
      .get(`files/${id}`)
      .auth(token)
      .request((err, resp, body) => {
        if (err || resp.statusCode !== 200) {
          err = this._error(err, resp)
          logger.error(err, 'provider.box.size.error')
          return done(err)
        }
        done(null, parseInt(body.size))
      })
  }

  logout ({ companion, token }, done) {
    const { key, secret } = companion.options.providerOptions.box

    return this.client
      .post('https://api.box.com/oauth2/revoke')
      .options({
        formData: {
          client_id: key,
          client_secret: secret,
          token
        }
      })
      .auth(token)
      .request((err, resp) => {
        if (err || resp.statusCode !== 200) {
          logger.error(err, 'provider.box.logout.error')
          done(this._error(err, resp))
          return
        }
        done(null, { revoked: true })
      })
  }

  adaptData (res, username, companion) {
    const data = { username, items: [] }
    const items = adapter.getItemSubList(res)
    items.forEach((item) => {
      data.items.push({
        isFolder: adapter.isFolder(item),
        icon: adapter.getItemIcon(item),
        name: adapter.getItemName(item),
        mimeType: adapter.getMimeType(item),
        id: adapter.getItemId(item),
        thumbnail: companion.buildURL(adapter.getItemThumbnailUrl(item), true),
        requestPath: adapter.getItemRequestPath(item),
        modifiedDate: adapter.getItemModifiedDate(item),
        size: adapter.getItemSize(item)
      })
    })

    data.nextPagePath = adapter.getNextPagePath(res)

    return data
  }

  _error (err, resp) {
    if (resp) {
      const fallbackMessage = `request to ${this.authProvider} returned ${resp.statusCode}`
      const errMsg = (resp.body || {}).message ? resp.body.message : fallbackMessage
      return resp.statusCode === 401 ? new ProviderAuthError() : new ProviderApiError(errMsg, resp.statusCode)
    }

    return err
  }
}

module.exports = Box
