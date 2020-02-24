const Provider = require('../Provider')

const request = require('request')
const purest = require('purest')({ request })
const logger = require('../../logger')
const adapter = require('./adapter')
const { ProviderApiError, ProviderAuthError } = require('../error')

/**
 * Adapter for API https://docs.microsoft.com/en-us/onedrive/developer/rest-api/
 */
class OneDrive extends Provider {
  constructor (options) {
    super(options)
    this.authProvider = options.provider = OneDrive.authProvider
    this.client = purest(options)
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
   * @param {function} done
   */
  list ({ directory, query, token }, done) {
    const path = directory ? `items/${directory}` : 'root'
    const rootPath = query.driveId ? `/drives/${query.driveId}` : '/drive'
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
        } else {
          this._userInfo({ token }, (err, infoResp) => {
            if (err || infoResp.statusCode !== 200) {
              err = this._error(err, infoResp)
              logger.error(err, 'provider.onedrive.user.error')
              return done(err)
            }
            done(null, this.adaptData(body, infoResp.body.mail || infoResp.body.userPrincipalName))
          })
        }
      })
  }

  download ({ id, token, query }, onData) {
    const rootPath = query.driveId ? `/drives/${query.driveId}` : '/drive'
    return this.client
      .get(`${rootPath}/items/${id}/content`)
      .auth(token)
      .request()
      .on('data', onData)
      .on('end', () => onData(null))
      .on('error', (err) => {
        logger.error(err, 'provider.onedrive.download.error')
      })
  }

  thumbnail (_, done) {
    // not implementing this because a public thumbnail from onedrive will be used instead
    const err = new Error('call to thumbnail is not implemented')
    logger.error(err, 'provider.onedrive.thumbnail.error')
    return done(err)
  }

  size ({ id, query, token }, done) {
    const rootPath = query.driveId ? `/drives/${query.driveId}` : '/drive'
    return this.client
      .get(`${rootPath}/items/${id}`)
      .auth(token)
      .request((err, resp, body) => {
        if (err || resp.statusCode !== 200) {
          err = this._error(err, resp)
          logger.error(err, 'provider.onedrive.size.error')
          return done(err)
        } else {
          done(null, body.size)
        }
      })
  }

  logout (_, done) {
    // access revoke is not supported by Microsoft/OneDrive's API
    done(null, { revoked: false, manual_revoke_url: 'https://account.live.com/consent/Manage' })
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
        size: adapter.getItemSize(item)
      })
    })

    data.nextPagePath = adapter.getNextPagePath(res)

    return data
  }

  _error (err, resp) {
    if (resp) {
      const fallbackMsg = `request to ${this.authProvider} returned ${resp.statusCode}`
      const errMsg = resp.body.error ? resp.body.error.message : fallbackMsg
      return resp.statusCode === 401 ? new ProviderAuthError() : new ProviderApiError(errMsg, resp.statusCode)
    }

    return err
  }
}

module.exports = OneDrive
