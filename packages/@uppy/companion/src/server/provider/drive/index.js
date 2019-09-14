const request = require('request')
// @ts-ignore
const purest = require('purest')({ request })
const logger = require('../../logger')
const adapter = require('./adapter')
const AuthError = require('../error')
const DRIVE_FILE_FIELDS = 'kind,id,name,mimeType,ownedByMe,permissions(role,emailAddress),size,modifiedTime,iconLink,thumbnailLink,teamDriveId'
const DRIVE_FILES_FIELDS = `kind,nextPageToken,incompleteSearch,files(${DRIVE_FILE_FIELDS})`
const TEAM_DRIVE_FIELDS = 'teamDrives(kind,id,name,backgroundImageLink)'

class Drive {
  constructor (options) {
    this.authProvider = options.provider = Drive.authProvider
    options.alias = 'drive'
    options.version = 'v3'

    this.client = purest(options)
  }

  static get authProvider () {
    return 'google'
  }

  list (options, done) {
    const directory = options.directory || 'root'
    const query = options.query || {}

    let teamDrivesPromise = Promise.resolve(undefined)

    const shouldListTeamDrives = directory === 'root' && !query.cursor
    if (shouldListTeamDrives) {
      teamDrivesPromise = new Promise((resolve) => {
        this.client
          .query()
          .get('teamdrives')
          .qs({ fields: TEAM_DRIVE_FIELDS })
          .auth(options.token)
          .request((err, resp) => {
            if (err) {
              logger.error(err, 'provider.drive.teamDrive.error')
              return
            }
            resolve(resp)
          })
      })
    }

    const where = {
      fields: DRIVE_FILES_FIELDS,
      pageToken: query.cursor,
      q: `'${directory}' in parents and trashed=false`,
      includeItemsFromAllDrives: true,
      supportsAllDrives: true
    }

    const filesPromise = new Promise((resolve, reject) => {
      this.client
        .query()
        .get('files')
        .qs(where)
        .auth(options.token)
        .request((err, resp) => {
          if (err || resp.statusCode !== 200) {
            reject(this._error(err, resp))
            return
          }
          resolve(resp)
        })
    })

    Promise.all([teamDrivesPromise, filesPromise])
      .then(
        ([teamDrives, filesResponse]) => {
          const returnData = this.adaptData(
            filesResponse.body,
            teamDrives && teamDrives.body,
            options.uppy,
            directory,
            query
          )
          done(null, returnData)
        },
        (reqErr) => {
          logger.error(reqErr, 'provider.drive.list.error')
          done(reqErr)
        }
      )
  }

  stats ({ id, token }, done) {
    return this.client
      .query()
      .get(`files/${id}`)
      .qs({ fields: DRIVE_FILE_FIELDS, supportsTeamDrives: true })
      .auth(token)
      .request(done)
  }

  download ({ id, token }, onData) {
    return this.client
      .query()
      .get(`files/${id}`)
      .qs({ alt: 'media', supportsTeamDrives: true })
      .auth(token)
      .request()
      .on('data', onData)
      .on('end', () => onData(null))
      .on('error', (err) => {
        logger.error(err, 'provider.drive.download.error')
      })
  }

  thumbnail ({ id, token }, done) {
    return this.stats({ id, token }, (err, resp, body) => {
      if (err || resp.statusCode !== 200) {
        err = this._error(err, resp)
        logger.error(err, 'provider.drive.thumbnail.error')
        return done(err)
      }

      done(null, body.thumbnailLink ? request(body.thumbnailLink) : null)
    })
  }

  size ({ id, token }, done) {
    return this.stats({ id, token }, (err, resp, body) => {
      if (err || resp.statusCode !== 200) {
        err = this._error(err, resp)
        logger.error(err, 'provider.drive.size.error')
        return done(err)
      }
      done(null, parseInt(body.size))
    })
  }

  logout ({ token }, done) {
    return this.client
      .get('https://accounts.google.com/o/oauth2/revoke')
      .qs({ token })
      .request((err, resp) => {
        if (err || resp.statusCode !== 200) {
          logger.error(err, 'provider.drive.logout.error')
          done(this._error(err, resp))
          return
        }
        done(null, { revoked: true })
      })
  }

  adaptData (res, teamDrivesResp, uppy, directory, query) {
    const adaptItem = (item) => ({
      isFolder: adapter.isFolder(item),
      icon: adapter.getItemIcon(item),
      name: adapter.getItemName(item),
      mimeType: adapter.getMimeType(item),
      id: adapter.getItemId(item),
      thumbnail: uppy.buildURL(adapter.getItemThumbnailUrl(item), true),
      requestPath: adapter.getItemRequestPath(item),
      modifiedDate: adapter.getItemModifiedDate(item),
      size: adapter.getItemSize(item),
      custom: {
        isTeamDrive: adapter.isTeamDrive(item)
      }
    })

    const items = adapter.getItemSubList(res)
    const teamDrives = teamDrivesResp ? teamDrivesResp.teamDrives || [] : []

    const adaptedItems = teamDrives.concat(items).map(adaptItem)

    return {
      username: adapter.getUsername(res),
      items: adaptedItems,
      nextPagePath: adapter.getNextPagePath(res, query, directory)
    }
  }

  _error (err, resp) {
    if (resp) {
      const errMsg = `request to ${this.authProvider} returned ${resp.statusCode}`
      return resp.statusCode === 401 ? new AuthError() : new Error(errMsg)
    }
    return err
  }
}

module.exports = Drive
