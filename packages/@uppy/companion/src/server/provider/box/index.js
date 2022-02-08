const request = require('request')
const purest = require('purest')({ request })
const { promisify } = require('util')

const Provider = require('../Provider')
const logger = require('../../logger')
const adapter = require('./adapter')
const { ProviderApiError, ProviderAuthError } = require('../error')
const { requestStream } = require('../../helpers/utils')

const BOX_FILES_FIELDS = 'id,modified_at,name,permissions,size,type'
const BOX_THUMBNAIL_SIZE = 256

/**
 * Adapter for API https://developer.box.com/reference/
 */
class Box extends Provider {
  constructor (options) {
    super(options)
    this.authProvider = Box.authProvider
    this.client = purest({
      ...options,
      provider: Box.authProvider,
    })
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
   * @param {Function} done
   */
  _list ({ directory, token, query, companion }, done) {
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
        }
        this._userInfo({ token }, (err, infoResp) => {
          if (err || infoResp.statusCode !== 200) {
            err = this._error(err, infoResp)
            logger.error(err, 'provider.token.user.error')
            return done(err)
          }
          done(null, this.adaptData(body, infoResp.body.login, companion))
        })
      })
  }

  async download ({ id, token }) {
    try {
      const req = this.client
        .get(`files/${id}/content`)
        .auth(token)
        .request()
      return await requestStream(req, async (res) => this._error(null, res))
    } catch (err) {
      logger.error(err, 'provider.box.download.error')
      throw err
    }
  }

  async thumbnail ({ id, token }) {
    const maxRetryTime = 10
    const extension = 'jpg' // set to png to more easily reproduce http 202 retry-after
    let remainingRetryTime = maxRetryTime

    const tryGetThumbnail = async () => {
      const req = this.client
        .get(`files/${id}/thumbnail.${extension}`)
        .qs({ max_height: BOX_THUMBNAIL_SIZE, max_width: BOX_THUMBNAIL_SIZE })
        .auth(token)
        .request()

      // See also requestStream
      const resp = await new Promise((resolve, reject) => (
        req
          .on('response', (response) => {
            // Don't allow any more data to flow yet.
            // https://github.com/request/request/issues/1990#issuecomment-184712275
            response.pause()
            resolve(response)
          })
          .on('error', reject)
      ))

      if (resp.statusCode === 200) {
        return { stream: resp }
      }

      req.abort() // Or we will leak memory (the stream is paused and we're not using this response stream anymore)

      // From box API docs:
      // Sometimes generating a thumbnail can take a few seconds.
      // In these situations the API returns a Location-header pointing to a placeholder graphic
      // for this file type.
      // The placeholder graphic can be used in a user interface until the thumbnail generation has completed.
      // The Retry-After-header indicates when to the thumbnail will be ready.
      // At that time, retry this endpoint to retrieve the thumbnail.
      //
      // This can be reproduced more easily by changing extension to png and trying on a newly uploaded image
      const retryAfter = parseInt(resp.headers['retry-after'], 10)
      if (!Number.isNaN(retryAfter)) {
        const retryInSec = Math.min(remainingRetryTime, retryAfter)
        if (retryInSec <= 0) throw new ProviderApiError('Timed out waiting for thumbnail', 504)
        logger.debug(`Need to retry box thumbnail in ${retryInSec} sec`)
        remainingRetryTime -= retryInSec
        await new Promise((resolve) => setTimeout(resolve, retryInSec * 1000))
        return tryGetThumbnail()
      }

      // we have an error status code, throw
      throw this._error(null, resp)
    }

    try {
      return await tryGetThumbnail()
    } catch (err) {
      logger.error(err, 'provider.box.thumbnail.error')
      throw err
    }
  }

  _size ({ id, token }, done) {
    return this.client
      .get(`files/${id}`)
      .auth(token)
      .request((err, resp, body) => {
        if (err || resp.statusCode !== 200) {
          err = this._error(err, resp)
          logger.error(err, 'provider.box.size.error')
          return done(err)
        }
        done(null, parseInt(body.size, 10))
      })
  }

  _logout ({ companion, token }, done) {
    const { key, secret } = companion.options.providerOptions.box

    return this.client
      .post('https://api.box.com/oauth2/revoke')
      .options({
        formData: {
          client_id: key,
          client_secret: secret,
          token,
        },
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
        size: adapter.getItemSize(item),
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

Box.version = 2

Box.prototype.list = promisify(Box.prototype._list)
Box.prototype.size = promisify(Box.prototype._size)
Box.prototype.logout = promisify(Box.prototype._logout)

module.exports = Box
