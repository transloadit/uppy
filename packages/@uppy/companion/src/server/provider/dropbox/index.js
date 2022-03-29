const request = require('request')
const purest = require('purest')({ request })
const { promisify } = require('util')

const Provider = require('../Provider')
const logger = require('../../logger')
const adapter = require('./adapter')
const { ProviderApiError, ProviderAuthError } = require('../error')
const { requestStream } = require('../../helpers/utils')

// From https://www.dropbox.com/developers/reference/json-encoding:
//
// This function is simple and has OK performance compared to more
// complicated ones: http://jsperf.com/json-escape-unicode/4
const charsToEncode = /[\u007f-\uffff]/g
function httpHeaderSafeJson (v) {
  return JSON.stringify(v).replace(charsToEncode,
    (c) => {
      return `\\u${(`000${c.charCodeAt(0).toString(16)}`).slice(-4)}`
    })
}

/**
 * Adapter for API https://www.dropbox.com/developers/documentation/http/documentation
 */
class DropBox extends Provider {
  constructor (options) {
    super(options)
    this.authProvider = DropBox.authProvider
    this.client = purest({
      ...options,
      provider: DropBox.authProvider,
    })
    // needed for the thumbnails fetched via companion
    this.needsCookieAuth = true
  }

  static get authProvider () {
    return 'dropbox'
  }

  _userInfo ({ token }, done) {
    this.client
      .post('users/get_current_account')
      .options({ version: '2' })
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
  _list (options, done) {
    let userInfoDone = false
    let statsDone = false
    let userInfo
    let stats
    let reqErr
    const finishReq = () => {
      if (reqErr) {
        logger.error(reqErr, 'provider.dropbox.list.error')
        done(reqErr)
      } else {
        stats.body.user_email = userInfo.body.email
        done(null, this.adaptData(stats.body, options.companion))
      }
    }

    this.stats(options, (err, resp) => {
      statsDone = true
      stats = resp
      if (err || resp.statusCode !== 200) {
        err = this._error(err, resp)
      }
      reqErr = reqErr || err
      if (userInfoDone) {
        finishReq()
      }
    })

    this._userInfo(options, (err, resp) => {
      userInfoDone = true
      userInfo = resp
      if (err || resp.statusCode !== 200) {
        err = this._error(err, resp)
      }

      reqErr = reqErr || err
      if (statsDone) {
        finishReq()
      }
    })
  }

  stats ({ directory, query, token }, done) {
    if (query.cursor) {
      this.client
        .post('files/list_folder/continue')
        .options({ version: '2' })
        .auth(token)
        .json({
          cursor: query.cursor,
        })
        .request(done)
      return
    }

    this.client
      .post('files/list_folder')
      .options({ version: '2' })
      .qs(query)
      .auth(token)
      .json({
        path: `${directory || ''}`,
        include_non_downloadable_files: false,
      })
      .request(done)
  }

  async download ({ id, token }) {
    try {
      const req = this.client
        .post('https://content.dropboxapi.com/2/files/download')
        .options({
          version: '2',
          headers: {
            'Dropbox-API-Arg': httpHeaderSafeJson({ path: `${id}` }),
          },
        })
        .auth(token)
        .request()

      return await requestStream(req, async (res) => this._error(null, res))
    } catch (err) {
      logger.error(err, 'provider.dropbox.download.error')
      throw err
    }
  }

  async thumbnail ({ id, token }) {
    try {
      const req = this.client
        .post('https://content.dropboxapi.com/2/files/get_thumbnail_v2')
        .options({
          headers: {
            'Dropbox-API-Arg': httpHeaderSafeJson({ resource: { '.tag': 'path', path: `${id}` }, size: 'w256h256' }),
          },
        })
        .auth(token)
        .request()

      return await requestStream(req, (resp) => this._error(null, resp))
    } catch (err) {
      logger.error(err, 'provider.dropbox.thumbnail.error')
      throw err
    }
  }

  _size ({ id, token }, done) {
    return this.client
      .post('files/get_metadata')
      .options({ version: '2' })
      .auth(token)
      .json({ path: id })
      .request((err, resp, body) => {
        if (err || resp.statusCode !== 200) {
          err = this._error(err, resp)
          logger.error(err, 'provider.dropbox.size.error')
          return done(err)
        }
        done(null, parseInt(body.size, 10))
      })
  }

  _logout ({ token }, done) {
    return this.client
      .post('auth/token/revoke')
      .options({ version: '2' })
      .auth(token)
      .request((err, resp) => {
        if (err || resp.statusCode !== 200) {
          logger.error(err, 'provider.dropbox.logout.error')
          done(this._error(err, resp))
          return
        }
        done(null, { revoked: true })
      })
  }

  adaptData (res, companion) {
    const data = { username: adapter.getUsername(res), items: [] }
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
      const errMsg = (resp.body || {}).error_summary ? resp.body.error_summary : fallbackMessage
      return resp.statusCode === 401 ? new ProviderAuthError() : new ProviderApiError(errMsg, resp.statusCode)
    }

    return err
  }
}

DropBox.version = 2

DropBox.prototype.list = promisify(DropBox.prototype._list)
DropBox.prototype.size = promisify(DropBox.prototype._size)
DropBox.prototype.logout = promisify(DropBox.prototype._logout)

module.exports = DropBox
