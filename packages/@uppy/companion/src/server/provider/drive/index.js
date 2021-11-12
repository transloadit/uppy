/* eslint-disable no-underscore-dangle */
const request = require('request')
const purest = require('purest')({ request })
const { promisify } = require('util')

const Provider = require('../Provider')
const logger = require('../../logger')
const adapter = require('./adapter')
const { ProviderApiError, ProviderAuthError } = require('../error')
const { requestStream } = require('../../helpers/utils')

const DRIVE_FILE_FIELDS = 'kind,id,imageMediaMetadata,name,mimeType,ownedByMe,permissions(role,emailAddress),size,modifiedTime,iconLink,thumbnailLink,teamDriveId,videoMediaMetadata,shortcutDetails(targetId,targetMimeType)'
const DRIVE_FILES_FIELDS = `kind,nextPageToken,incompleteSearch,files(${DRIVE_FILE_FIELDS})`
// using wildcard to get all 'drive' fields because specifying fields seems no to work for the /drives endpoint
const SHARED_DRIVE_FIELDS = '*'

// Hopefully this name will not be used by Google
const VIRTUAL_SHARED_DIR = 'shared-with-me'

function sortByName (first, second) {
  return first.name.localeCompare(second.name)
}

async function waitForFailedResponse (resp) {
  const buf = await new Promise((resolve) => {
    let data = ''
    resp.on('data', (chunk) => {
      data += chunk
    }).on('end', () => resolve(data))
    resp.resume()
  })
  return JSON.parse(buf.toString())
}

function adaptData (listFilesResp, sharedDrivesResp, directory, query, showSharedWithMe) {
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
      isSharedDrive: adapter.isSharedDrive(item),
      imageHeight: adapter.getImageHeight(item),
      imageWidth: adapter.getImageWidth(item),
      imageRotation: adapter.getImageRotation(item),
      imageDateTime: adapter.getImageDate(item),
      videoHeight: adapter.getVideoHeight(item),
      videoWidth: adapter.getVideoWidth(item),
      videoDurationMillis: adapter.getVideoDurationMillis(item),
    },
  })

  const items = adapter.getItemSubList(listFilesResp)
  const sharedDrives = sharedDrivesResp ? sharedDrivesResp.drives || [] : []

  // “Shared with me” is a list of shared documents,
  // not the same as sharedDrives
  const virtualItem = showSharedWithMe && ({
    isFolder: true,
    icon: 'folder',
    name: 'Shared with me',
    mimeType: 'application/vnd.google-apps.folder',
    id: VIRTUAL_SHARED_DIR,
    requestPath: VIRTUAL_SHARED_DIR,
  })

  const adaptedItems = [
    ...(virtualItem ? [virtualItem] : []), // shared folder first
    ...([...sharedDrives, ...items].map(adaptItem).sort(sortByName)),
  ]

  return {
    username: adapter.getUsername(listFilesResp),
    items: adaptedItems,
    nextPagePath: adapter.getNextPagePath(listFilesResp, query, directory),
  }
}

/**
 * Adapter for API https://developers.google.com/drive/api/v3/
 */
class Drive extends Provider {
  constructor (options) {
    super(options)
    this.authProvider = Drive.authProvider

    this.client = purest({
      ...options,
      provider: Drive.authProvider,
      alias: 'drive',
      version: 'v3',
    })
  }

  static get authProvider () {
    return 'google'
  }

  async list (options) {
    const directory = options.directory || 'root'
    const query = options.query || {}

    const { client } = this
    const handleErrorResponse = this._error.bind(this)

    const isRoot = directory === 'root'
    const isVirtualSharedDirRoot = directory === VIRTUAL_SHARED_DIR

    async function fetchSharedDrives () {
      try {
        const shouldListSharedDrives = isRoot && !query.cursor
        if (!shouldListSharedDrives) return undefined

        const resp = await new Promise((resolve, reject) => client
          .get('drives')
          .qs({ fields: SHARED_DRIVE_FIELDS })
          .auth(options.token)
          .request((err, resp2) => {
            if (err || resp2.statusCode !== 200) return reject(handleErrorResponse(err, resp2))
            return resolve(resp2)
          }))

        return resp && resp.body
      } catch (err) {
        logger.error(err, 'provider.drive.sharedDrive.error')
        throw err
      }
    }

    async function fetchFiles () {
      // Shared with me items in root don't have any parents
      const q = isVirtualSharedDirRoot
        ? `sharedWithMe and trashed=false`
        : `('${directory}' in parents) and trashed=false`

      const where = {
        fields: DRIVE_FILES_FIELDS,
        pageToken: query.cursor,
        q,
        // pageSize: 10, // can be used for testing pagination if you don't have many files
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
      }

      try {
        const resp = await new Promise((resolve, reject) => client
          .query()
          .get('files')
          .qs(where)
          .auth(options.token)
          .request((err, resp2) => {
            if (err || resp2.statusCode !== 200) return reject(handleErrorResponse(err, resp2))
            return resolve(resp2)
          }))

        return resp && resp.body
      } catch (err) {
        logger.error(err, 'provider.drive.list.error')
        throw err
      }
    }

    const [sharedDrives, filesResponse] = await Promise.all([fetchSharedDrives(), fetchFiles()])
    // console.log({ directory, sharedDrives, filesResponse })

    return adaptData(
      filesResponse,
      sharedDrives,
      directory,
      query,
      isRoot && !query.cursor, // we can only show it on the first page request, or else we will have duplicates of it
    )
  }

  async _stats ({ id, token }) {
    const getStats = async (statsOfId) => new Promise((resolve, reject) => {
      this.client
        .query()
        .get(`files/${encodeURIComponent(statsOfId)}`)
        .qs({ fields: DRIVE_FILE_FIELDS, supportsAllDrives: true })
        .auth(token)
        .request((err, resp) => {
          if (err || resp.statusCode !== 200) return reject(this._error.bind(this)(err, resp))
          return resolve(resp.body)
        })
    })

    let stats = await getStats(id)

    // If it is a shortcut, we need to get stats again on the target
    if (adapter.isShortcut(stats.mimeType)) {
      stats = await getStats(stats.shortcutDetails.targetId)
    }
    return stats
  }

  _exportGsuiteFile (id, token, mimeType) {
    logger.info(`calling google file export for ${id} to ${mimeType}`, 'provider.drive.export')
    return this.client
      .query()
      .get(`files/${encodeURIComponent(id)}/export`)
      .qs({ supportsAllDrives: true, mimeType })
      .auth(token)
      .request()
  }

  async download ({ id: idIn, token }) {
    try {
      const { mimeType, id } = await this._stats({ id: idIn, token })

      const req = adapter.isGsuiteFile(mimeType)
        ? this._exportGsuiteFile(id, token, adapter.getGsuiteExportType(mimeType))
        : this.client
          .query()
          .get(`files/${encodeURIComponent(id)}`)
          .qs({ alt: 'media', supportsAllDrives: true })
          .auth(token)
          .request()

      return await requestStream(req, async (res) => {
        try {
          const jsonResp = await waitForFailedResponse(res)
          return this._error(null, { ...res, body: jsonResp })
        } catch (err2) {
          return this._error(err2, res)
        }
      })
    } catch (err) {
      logger.error(err, 'provider.drive.download.error')
      throw err
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async thumbnail () {
    // not implementing this because a public thumbnail from googledrive will be used instead
    logger.error('call to thumbnail is not implemented', 'provider.drive.thumbnail.error')
    throw new Error('call to thumbnail is not implemented')
  }

  async size ({ id, token }) {
    try {
      const { mimeType, size } = await this._stats({ id, token })

      if (adapter.isGsuiteFile(mimeType)) {
        // GSuite file sizes cannot be predetermined (but are max 10MB)
        // e.g. Transfer-Encoding: chunked
        return undefined
      }

      return parseInt(size, 10)
    } catch (err) {
      logger.error(err, 'provider.drive.size.error')
      throw err
    }
  }

  _logout ({ token }, done) {
    this.client
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

  _error (err, resp) {
    if (resp) {
      const fallbackMessage = `request to ${this.authProvider} returned ${resp.statusCode}`
      const errMsg = (resp.body && resp.body.error) ? resp.body.error.message : fallbackMessage
      return resp.statusCode === 401 ? new ProviderAuthError() : new ProviderApiError(errMsg, resp.statusCode)
    }
    return err
  }
}

Drive.version = 2

Drive.prototype.logout = promisify(Drive.prototype._logout)

module.exports = Drive
