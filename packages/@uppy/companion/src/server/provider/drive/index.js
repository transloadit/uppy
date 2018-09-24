const request = require('request')
// @ts-ignore
const purest = require('purest')({ request })
const logger = require('../../logger')
const DRIVE_FILE_FIELDS = 'kind,id,name,mimeType,ownedByMe,permissions(role,emailAddress),size,modifiedTime,iconLink,thumbnailLink,teamDriveId'
const DRIVE_FILES_FIELDS = `kind,nextPageToken,incompleteSearch,files(${DRIVE_FILE_FIELDS})`
const TEAM_DRIVE_FIELDS = 'teamDrives(kind,id,name,backgroundImageLink)'
/**
 * @class
 * @implements {Provider}
 */
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
    const trashed = options.trashed || false
    const query = options.query || {}
    const listTeamDrives = query.listTeamDrives || 'false'
    const teamDriveId = query.teamDriveId || false

    if (listTeamDrives === 'true') {
      // Just return a list of all Team Drives which the user can access.
      return this.client
        .query()
        .get('teamdrives')
        .where({ fields: TEAM_DRIVE_FIELDS })
        .auth(options.token)
        .request(done)
    } else {
      let where = {
        fields: DRIVE_FILES_FIELDS,
        q: `'${directory}' in parents and trashed=${trashed}`
      }
      if (teamDriveId) {
        // Team Drives require several extra parameters in order to work.
        where.supportsTeamDrives = true
        where.includeTeamDriveItems = true
        where.teamDriveId = teamDriveId
        where.corpora = 'teamDrive'
        if (directory === 'root') {
          // To list the top-level contents of a Team Drive, filter for the Team Drive id as a parent.
          where.q = `'${teamDriveId}' in parents and trashed=${trashed}`
        }
      }

      return this.client
        .query()
        .get('files')
        .where(where)
        .auth(options.token)
        .request(done)
    }
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
      done(body.thumbnailLink ? request(body.thumbnailLink) : null)
    })
  }

  size ({id, token}, done) {
    return this.stats({ id, token }, (err, resp, body) => {
      if (err) {
        logger.error(err, 'provider.drive.size.error')
        return done(null)
      }
      done(parseInt(body.size))
    })
  }

  adaptData () {
    
  }
}

module.exports = Drive
