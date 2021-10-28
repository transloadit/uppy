const request = require('request')
const purest = require('purest')({ request })
const { promisify } = require('util')

const Provider = require('../Provider')
const logger = require('../../logger')
const adapter = require('./adapter')
const { ProviderApiError, ProviderAuthError } = require('../error')
const { requestStream } = require('../../helpers/utils')

/**
 * Adapter for API https://docs.microsoft.com/en-us/onedrive/developer/rest-api/
 */
class OneDrive extends Provider {
  constructor (options) {
    super(options)
    this.authProvider = OneDrive.authProvider
    this.client = purest({
      ...options,
      provider: OneDrive.authProvider,
    })
  }

  static get authProvider () {
    return 'microsoft'
  }

  _userInfo ({ token }, done) {
    this.client
      .get('me')
      .auth(token)
      .request(done)
  }

  /**
   * Makes 2 requests in parallel - 1. to get files, 2. to get user email
   * it then waits till both requests are done before proceeding with the callback
   *
   * @param {object} options
   * @param {Function} done
   */
  _list ({ directory, query, token }, done) {
    const path = directory ? `items/${directory}` : 'root'
    const rootPath = query.driveId ? `/drives/${query.driveId}` : '/me/drive'
    const qs = { $expand: 'thumbnails' }
    if (query.cursor) {
      qs.$skiptoken = query.cursor
    }

    this.client
      .get(`${rootPath}/${path}/children`)
      .qs(qs)
      .auth(token)
      .request((err, resp, body) => {
        if (err || resp.statusCode !== 200) {
          err = this._error(err, resp)
          logger.error(err, 'provider.onedrive.list.error')
          return done(err)
        }
        this._userInfo({ token }, (err, infoResp) => {
          if (err || infoResp.statusCode !== 200) {
            err = this._error(err, infoResp)
            logger.error(err, 'provider.onedrive.user.error')
            return done(err)
          }
          done(null, this.adaptData(body, infoResp.body.mail || infoResp.body.userPrincipalName))
        })
      })
  }

  async download ({ id, token, query }) {
    try {
      const rootPath = query.driveId ? `/drives/${query.driveId}` : '/me/drive'

      const req = this.client
        .get(`${rootPath}/items/${id}/content`)
        .auth(token)
        .request()

      return await requestStream(req, async (res) => this._error(null, res))
    } catch (err) {
      logger.error(err, 'provider.onedrive.download.error')
      throw err
    }
  }

  async thumbnail () {
    // not implementing this because a public thumbnail from onedrive will be used instead
    logger.error('call to thumbnail is not implemented', 'provider.onedrive.thumbnail.error')
    throw new Error('call to thumbnail is not implemented')
  }

  _size ({ id, query, token }, done) {
    const rootPath = query.driveId ? `/drives/${query.driveId}` : '/me/drive'
    return this.client
      .get(`${rootPath}/items/${id}`)
      .auth(token)
      .request((err, resp, body) => {
        if (err || resp.statusCode !== 200) {
          err = this._error(err, resp)
          logger.error(err, 'provider.onedrive.size.error')
          return done(err)
        }
        done(null, body.size)
      })
  }

  async logout () {
    return { revoked: false, manual_revoke_url: 'https://account.live.com/consent/Manage' }
  }

  adaptData (res, username) {
    const data = { username, items: [] }
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
        modifiedDate: adapter.getItemModifiedDate(item),
        size: adapter.getItemSize(item),
      })
    })

    data.nextPagePath = adapter.getNextPagePath(res)

    return data
  }

  _error (err, resp) {
    if (resp) {
      const fallbackMsg = `request to ${this.authProvider} returned ${resp.statusCode}`
      const errMsg = (resp.body || {}).error ? resp.body.error.message : fallbackMsg
      return resp.statusCode === 401 ? new ProviderAuthError() : new ProviderApiError(errMsg, resp.statusCode)
    }

    return err
  }
}

OneDrive.version = 2

OneDrive.prototype.list = promisify(OneDrive.prototype._list)
OneDrive.prototype.size = promisify(OneDrive.prototype._size)

module.exports = OneDrive
