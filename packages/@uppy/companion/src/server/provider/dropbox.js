const request = require('request')
const purest = require('purest')({ request })
const logger = require('../logger')

/**
 *
 */
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
      if (!reqErr) {
        stats.body.user_email = userInfo.body.email
      }
      done(reqErr, stats, stats.body)
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
      .on('response', done)
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

        done(body.size)
      })
  }
}

module.exports = DropBox
