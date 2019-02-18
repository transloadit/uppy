const request = require('request')
const purest = require('purest')({ request })
const logger = require('../../logger')
const adapter = require('./adapter')
const AuthError = require('../error')

class DropBox {
  constructor (options) {
    this.authProvider = options.provider = DropBox.authProvider
    this.client = purest(options)
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
      if (reqErr) {
        done(reqErr)
      } else if (stats.statusCode !== 200) {
        done(this._error(stats.statusCode))
      } else {
        stats.body.user_email = userInfo.body.email
        done(null, this.adaptData(stats.body, options.uppy))
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
    this.client
      .post('files/list_folder')
      .options({version: '2'})
      .where(query)
      .auth(token)
      .json({
        path: `${directory || ''}`,
        include_media_info: true
      })
      .request(done)
  }

  download ({ id, token }, onData) {
    return this.client
      .post('https://content.dropboxapi.com/2/files/download')
      .options({
        version: '2',
        headers: {
          'Dropbox-API-Arg': JSON.stringify({path: `${id}`})
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

  thumbnail ({id, token}, done) {
    return this.client
      .post('https://content.dropboxapi.com/2/files/get_thumbnail')
      .options({
        version: '2',
        headers: {
          'Dropbox-API-Arg': JSON.stringify({path: `${id}`})
        }
      })
      .auth(token)
      .request()
      .on('response', (resp) => {
        if (resp.statusCode !== 200) {
          return done(this._error(resp.statusCode))
        }
        done(null, resp)
      })
      .on('error', (err) => {
        logger.error(err, 'provider.dropbox.thumbnail.error')
      })
  }

  size ({id, token}, done) {
    return this.client
      .post('files/get_metadata')
      .options({ version: '2' })
      .auth(token)
      .json({
        path: id,
        include_media_info: true
      })
      .request((err, resp, body) => {
        if (err) {
          logger.error(err, 'provider.dropbox.size.error')
          return done(null)
        }

        if (resp.statusCode !== 200) {
          return done(this._error(resp.statusCode))
        }
        done(null, parseInt(body.size))
      })
  }

  adaptData (res, uppy) {
    const data = { username: adapter.getUsername(res), items: [] }
    const items = adapter.getItemSubList(res)
    items.forEach((item) => {
      data.items.push({
        isFolder: adapter.isFolder(item),
        icon: adapter.getItemIcon(item),
        name: adapter.getItemName(item),
        mimeType: adapter.getMimeType(item),
        id: adapter.getItemId(item),
        thumbnail: uppy.buildURL(adapter.getItemThumbnailUrl(item), true),
        requestPath: adapter.getItemRequestPath(item),
        modifiedDate: adapter.getItemModifiedDate(item)
      })
    })

    data.nextPagePath = null

    return data
  }

  _error (statusCode) {
    if (statusCode === 401) {
      return new AuthError()
    }

    return new Error(`request to ${this.authProvider} returned ${statusCode}`)
  }
}

module.exports = DropBox
