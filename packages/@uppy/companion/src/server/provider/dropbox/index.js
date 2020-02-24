const Provider = require('../Provider')

const request = require('request')
const purest = require('purest')({ request })
const logger = require('../../logger')
const adapter = require('./adapter')
const { ProviderApiError, ProviderAuthError } = require('../error')

// From https://www.dropbox.com/developers/reference/json-encoding:
//
// This function is simple and has OK performance compared to more
// complicated ones: http://jsperf.com/json-escape-unicode/4
const charsToEncode = /[\u007f-\uffff]/g
function httpHeaderSafeJson (v) {
  return JSON.stringify(v).replace(charsToEncode,
    function (c) {
      return '\\u' + ('000' + c.charCodeAt(0).toString(16)).slice(-4)
    }
  )
}

/**
 * Adapter for API https://www.dropbox.com/developers/documentation/http/documentation
 */
class DropBox extends Provider {
  constructor (options) {
    super(options)
    this.authProvider = options.provider = DropBox.authProvider
    this.client = purest(options)
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
   * @param {function} done
   */
  list (options, done) {
    let userInfoDone = false
    let statsDone = false
    let userInfo
    let stats
    let reqErr
    const finishReq = () => {
      if (reqErr || stats.statusCode !== 200) {
        const err = this._error(reqErr, stats)
        logger.error(err, 'provider.dropbox.list.error')
        done(err)
      } else {
        stats.body.user_email = userInfo.body.email
        done(null, this.adaptData(stats.body, options.companion))
      }
    }

    this.stats(options, (err, resp) => {
      statsDone = true
      stats = resp
      reqErr = reqErr || err
      if (userInfoDone) {
        finishReq()
      }
    })

    this._userInfo(options, (err, resp) => {
      userInfoDone = true
      userInfo = resp
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
          cursor: query.cursor
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
        path: `${directory || ''}`
      })
      .request(done)
  }

  download ({ id, token }, onData) {
    return this.client
      .post('https://content.dropboxapi.com/2/files/download')
      .options({
        version: '2',
        headers: {
          'Dropbox-API-Arg': httpHeaderSafeJson({ path: `${id}` })
        }
      })
      .auth(token)
      .request()
      .on('data', onData)
      .on('end', () => onData(null))
      .on('error', (err) => {
        logger.error(err, 'provider.dropbox.download.error')
      })
  }

  thumbnail ({ id, token }, done) {
    return this.client
      .post('https://content.dropboxapi.com/2/files/get_thumbnail')
      .options({
        version: '2',
        headers: {
          'Dropbox-API-Arg': httpHeaderSafeJson({ path: `${id}`, size: 'w256h256' })
        }
      })
      .auth(token)
      .request()
      .on('response', (resp) => {
        if (resp.statusCode !== 200) {
          const err = this._error(null, resp)
          logger.error(err, 'provider.dropbox.thumbnail.error')
          return done(err)
        }
        done(null, resp)
      })
      .on('error', (err) => {
        logger.error(err, 'provider.dropbox.thumbnail.error')
      })
  }

  size ({ id, token }, done) {
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
        done(null, parseInt(body.size))
      })
  }

  logout ({ token }, done) {
    return this.client
      .post('auth/token/revoke')
      .options({ version: '2' })
      .auth(token)
      .request((err, resp) => {
        if (err || resp.statusCode !== 200) {
          logger.error(err, 'provider.dropbox.size.error')
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
        size: adapter.getItemSize(item)
      })
    })

    data.nextPagePath = adapter.getNextPagePath(res)

    return data
  }

  _error (err, resp) {
    if (resp) {
      const fallbackMessage = `request to ${this.authProvider} returned ${resp.statusCode}`
      const errMsg = resp.body.error_summary ? resp.body.error_summary : fallbackMessage
      return resp.statusCode === 401 ? new ProviderAuthError() : new ProviderApiError(errMsg, resp.statusCode)
    }

    return err
  }
}

module.exports = DropBox
