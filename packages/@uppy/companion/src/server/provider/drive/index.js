const Provider = require('../Provider')

const request = require('request')
// @ts-ignore
const purest = require('purest')({ request })
const logger = require('../../logger')
const adapter = require('./adapter')
const { ProviderApiError, ProviderAuthError } = require('../error')
const DRIVE_FILE_FIELDS = 'kind,id,name,mimeType,ownedByMe,permissions(role,emailAddress),size,modifiedTime,iconLink,thumbnailLink,teamDriveId'
const DRIVE_FILES_FIELDS = `kind,nextPageToken,incompleteSearch,files(${DRIVE_FILE_FIELDS})`
// using wildcard to get all 'drive' fields because specifying fields seems no to work for the /drives endpoint
const SHARED_DRIVE_FIELDS = '*'

/**
 * Adapter for API https://developers.google.com/drive/api/v3/
 */
class Drive extends Provider {
  constructor (options) {
    super(options)
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

    let sharedDrivesPromise = Promise.resolve(undefined)

    const shouldListSharedDrives = directory === 'root' && !query.cursor
    if (shouldListSharedDrives) {
      sharedDrivesPromise = new Promise((resolve) => {
        this.client
          .query()
          .get('drives')
          .qs({ fields: SHARED_DRIVE_FIELDS })
          .auth(options.token)
          .request((err, resp) => {
            if (err) {
              logger.error(err, 'provider.drive.sharedDrive.error')
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

    Promise.all([sharedDrivesPromise, filesPromise])
      .then(
        ([sharedDrives, filesResponse]) => {
          const returnData = this.adaptData(
            filesResponse.body,
            sharedDrives && sharedDrives.body,
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
      .qs({ fields: DRIVE_FILE_FIELDS, supportsAllDrives: true })
      .auth(token)
      .request(done)
  }

  _exportGsuiteFile (id, token, mimeType) {
    logger.info(`calling google file export for ${id} to ${mimeType}`, 'provider.drive.export')
    return this.client
      .query()
      .get(`files/${id}/export`)
      .qs({ supportsAllDrives: true, mimeType })
      .auth(token)
      .request()
  }

  _getGsuiteFileMeta (id, token, mimeType, onDone) {
    logger.info(`calling Gsuite file meta for ${id}`, 'provider.drive.export.meta')
    return this.client
      .query()
      .head(`files/${id}/export`)
      .qs({ supportsAllDrives: true, mimeType })
      .auth(token)
      .request(onDone)
  }

  _getGsuiteExportType (mimeType) {
    const typeMaps = {
      'application/vnd.google-apps.document': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.google-apps.drawing': 'image/png',
      'application/vnd.google-apps.script': 'application/vnd.google-apps.script+json',
      'application/vnd.google-apps.spreadsheet': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.google-apps.presentation': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    }

    return typeMaps[mimeType] || 'application/pdf'
  }

  _isGsuiteFile (mimeType) {
    return mimeType.startsWith('application/vnd.google')
  }

  download ({ id, token }, onData) {
    this.stats({ id, token }, (err, resp, body) => {
      if (err) {
        logger.error(err, 'provider.drive.download.stats.error')
        onData(err)
        return
      }

      let requestStream
      if (this._isGsuiteFile(body.mimeType)) {
        requestStream = this._exportGsuiteFile(id, token, this._getGsuiteExportType(body.mimeType))
      } else {
        requestStream = this.client
          .query()
          .get(`files/${id}`)
          .qs({ alt: 'media', supportsAllDrives: true })
          .auth(token)
          .request()
      }

      requestStream
        .on('data', (chunk) => onData(null, chunk))
        .on('end', () => onData(null, null))
        .on('error', (err) => {
          logger.error(err, 'provider.drive.download.error')
          onData(err)
        })
    })
  }

  thumbnail (_, done) {
    // not implementing this because a public thumbnail from googledrive will be used instead
    const err = new Error('call to thumbnail is not implemented')
    logger.error(err, 'provider.drive.thumbnail.error')
    return done(err)
  }

  size ({ id, token }, done) {
    return this.stats({ id, token }, (err, resp, body) => {
      if (err || resp.statusCode !== 200) {
        err = this._error(err, resp)
        logger.error(err, 'provider.drive.size.error')
        return done(err)
      }

      if (this._isGsuiteFile(body.mimeType)) {
        // Google Docs file sizes can be determined
        // while Google sheets file sizes can't be determined
        const googleDocMimeType = 'application/vnd.google-apps.document'
        if (body.mimeType !== googleDocMimeType) {
          const maxExportFileSize = 10 * 1024 * 1024 // 10 MB
          done(null, maxExportFileSize)
          return
        }

        this._getGsuiteFileMeta(id, token, this._getGsuiteExportType(body.mimeType), (err, resp) => {
          if (err || resp.statusCode !== 200) {
            err = this._error(err, resp)
            logger.error(err, 'provider.drive.docs.size.error')
            return done(err)
          }

          const size = resp.headers['content-length']
          done(null, size ? parseInt(size) : null)
        })
      } else {
        done(null, parseInt(body.size))
      }
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

  adaptData (res, sharedDrivesResp, directory, query) {
    const adaptItem = (item) => ({
      isFolder: adapter.isFolder(item),
      icon: adapter.getItemIcon(item),
      name: adapter.getItemName(item),
      mimeType: adapter.getMimeType(item),
      id: adapter.getItemId(item),
      thumbnail: adapter.getItemThumbnailUrl(item),
      requestPath: adapter.getItemRequestPath(item),
      modifiedDate: adapter.getItemModifiedDate(item),
      size: adapter.getItemSize(item),
      custom: {
        // @todo isTeamDrive is left for backward compatibility. We should remove it in the next
        // major release.
        isTeamDrive: adapter.isSharedDrive(item),
        isSharedDrive: adapter.isSharedDrive(item)
      }
    })

    const items = adapter.getItemSubList(res)
    const sharedDrives = sharedDrivesResp ? sharedDrivesResp.drives || [] : []

    const adaptedItems = sharedDrives.concat(items).map(adaptItem)

    return {
      username: adapter.getUsername(res),
      items: adaptedItems,
      nextPagePath: adapter.getNextPagePath(res, query, directory)
    }
  }

  _error (err, resp) {
    if (resp) {
      const fallbackMessage = `request to ${this.authProvider} returned ${resp.statusCode}`
      const errMsg = (resp.body && resp.body.error) ? resp.body.error.message : fallbackMessage
      return resp.statusCode === 401 ? new ProviderAuthError() : new ProviderApiError(errMsg, resp.statusCode)
    }
    return err
  }
}

module.exports = Drive
