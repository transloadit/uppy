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
    const teamDrive = query.teamDrive
    let listDone = false
    let teamDrivesDone = false
    let teamDrives
    let listResponse
    let reqErr
    const finishReq = () => {
      if (reqErr) {
        done(reqErr)
      } else if (listResponse.statusCode !== 200) {
        done(this._error(listResponse.statusCode))
      } else {
        done(null, this.adaptData(listResponse.body, teamDrives ? teamDrives.body : null, options.uppy))
      }
    }

    if (directory === 'root') {
      // fetch a list of all Team Drives which the user can access.
      this.client
        .query()
        .get('teamdrives')
        .where({ fields: TEAM_DRIVE_FIELDS })
        .auth(options.token)
        .request((err, resp) => {
          if (err) {
            logger.error(err, 'provider.drive.teamDrive.error')
          }
          teamDrivesDone = true
          teamDrives = resp
          if (listDone) {
            finishReq()
          }
        })
    }

    let where = {
      fields: DRIVE_FILES_FIELDS,
      q: `'${directory}' in parents and trashed=false`
    }
    if (teamDrive) {
      // Team Drives require several extra parameters in order to work.
      where.supportsTeamDrives = true
      where.includeTeamDriveItems = true
      where.teamDriveId = directory
      where.corpora = 'teamDrive'
    }

    this.client
      .query()
      .get('files')
      .where(where)
      .auth(options.token)
      .request((err, resp) => {
        listDone = true
        listResponse = resp
        reqErr = err
        if (teamDrivesDone || directory !== 'root') {
          finishReq()
        }
      })
  }

  stats ({ id, token }, done) {
    return this.client
      .query()
      .get(`files/${id}`)
      .where({ fields: DRIVE_FILE_FIELDS, supportsTeamDrives: true })
      .auth(token)
      .request(done)
  }

  download ({ id, token }, onData) {
    return this.client
      .query()
      .get(`files/${id}`)
      .where({ alt: 'media', supportsTeamDrives: true })
      .auth(token)
      .request()
      .on('data', onData)
      .on('end', () => onData(null))
      .on('error', (err) => {
        logger.error(err, 'provider.drive.download.error')
      })
  }

  thumbnail ({id, token}, done) {
    return this.stats({id, token}, (err, resp, body) => {
      if (err) {
        logger.error(err, 'provider.drive.thumbnail.error')
        return done(null)
      }

      if (resp.statusCode !== 200) {
        return done(this._error(resp.statusCode))
      }

      done(null, body.thumbnailLink ? request(body.thumbnailLink) : null)
    })
  }

  size ({id, token}, done) {
    return this.stats({ id, token }, (err, resp, body) => {
      if (err) {
        logger.error(err, 'provider.drive.size.error')
        return done(null)
      }

      if (resp.statusCode !== 200) {
        return done(this._error(resp.statusCode))
      }
      done(null, parseInt(body.size))
    })
  }

  adaptData (res, teamDrivesResp, uppy) {
    const data = { username: adapter.getUsername(res), items: [] }
    const items = adapter.getItemSubList(res)
    const teamDrives = teamDrivesResp ? teamDrivesResp.teamDrives || [] : []
    items.concat(teamDrives).forEach((item) => {
      data.items.push({
        isFolder: adapter.isFolder(item),
        icon: adapter.getItemIcon(item),
        name: adapter.getItemName(item),
        mimeType: adapter.getMimeType(item),
        id: adapter.getItemId(item),
        thumbnail: uppy.buildURL(adapter.getItemThumbnailUrl(item), true),
        requestPath: adapter.getItemRequestPath(item),
        modifiedDate: adapter.getItemModifiedDate(item),
        custom: {
          isTeamDrive: adapter.isTeamDrive(item)
        }
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

module.exports = Drive
