const got = require('got').default

const Provider = require('../Provider')
const logger = require('../../logger')
const { VIRTUAL_SHARED_DIR, adaptData, isShortcut, isGsuiteFile, getGsuiteExportType } = require('./adapter')
const { withProviderErrorHandling } = require('../providerErrors')
const { prepareStream } = require('../../helpers/utils')

const DRIVE_FILE_FIELDS = 'kind,id,imageMediaMetadata,name,mimeType,ownedByMe,size,modifiedTime,iconLink,thumbnailLink,teamDriveId,videoMediaMetadata,shortcutDetails(targetId,targetMimeType)'
const DRIVE_FILES_FIELDS = `kind,nextPageToken,incompleteSearch,files(${DRIVE_FILE_FIELDS})`
// using wildcard to get all 'drive' fields because specifying fields seems no to work for the /drives endpoint
const SHARED_DRIVE_FIELDS = '*'

const getClient = ({ token }) => got.extend({
  prefixUrl: 'https://www.googleapis.com/drive/v3',
  headers: {
    authorization: `Bearer ${token}`,
  },
})

const getOauthClient = () => got.extend({
  prefixUrl: 'https://oauth2.googleapis.com',
})

async function getStats ({ id, token }) {
  const client = getClient({ token })

  const getStatsInner = async (statsOfId) => (
    client.get(`files/${encodeURIComponent(statsOfId)}`, { searchParams: { fields: DRIVE_FILE_FIELDS, supportsAllDrives: true }, responseType: 'json' }).json()
  )

  const stats = await getStatsInner(id)

  // If it is a shortcut, we need to get stats again on the target
  if (isShortcut(stats.mimeType)) return getStatsInner(stats.shortcutDetails.targetId)
  return stats
}

/**
 * Adapter for API https://developers.google.com/drive/api/v3/
 */
class Drive extends Provider {
  constructor (options) {
    super(options)
    this.authProvider = Drive.authProvider
  }

  static get authProvider () {
    return 'google'
  }

  async list (options) {
    return this.#withErrorHandling('provider.drive.list.error', async () => {
      const directory = options.directory || 'root'
      const query = options.query || {}
      const { token } = options

      const isRoot = directory === 'root'
      const isVirtualSharedDirRoot = directory === VIRTUAL_SHARED_DIR

      const client = getClient({ token })

      async function fetchSharedDrives (pageToken = null) {
        const shouldListSharedDrives = isRoot && !query.cursor
        if (!shouldListSharedDrives) return undefined

        const response = await client.get('drives', { searchParams: { fields: SHARED_DRIVE_FIELDS, pageToken, pageSize: 100 }, responseType: 'json' }).json()

        const { nextPageToken } = response
        if (nextPageToken) {
          const nextResponse = await fetchSharedDrives(nextPageToken)
          if (!nextResponse) return response
          return { ...nextResponse, drives: [...response.drives, ...nextResponse.drives] }
        }

        return response
      }

      async function fetchFiles () {
        // Shared with me items in root don't have any parents
        const q = isVirtualSharedDirRoot
          ? `sharedWithMe and trashed=false`
          : `('${directory}' in parents) and trashed=false`

        const searchParams = {
          fields: DRIVE_FILES_FIELDS,
          pageToken: query.cursor,
          q,
          // We can only do a page size of 1000 because we do not request permissions in DRIVE_FILES_FIELDS.
          // Otherwise we are limited to 100. Instead we get the user info from `this.user()`
          pageSize: 1000,
          orderBy: 'folder,name',
          includeItemsFromAllDrives: true,
          supportsAllDrives: true,
        }

        return client.get('files', { searchParams, responseType: 'json' }).json()
      }

      async function fetchAbout () {
        const searchParams = { fields: 'user' }

        return client.get('about', { searchParams, responseType: 'json' }).json()
      }

      const [sharedDrives, filesResponse, about] = await Promise.all([fetchSharedDrives(), fetchFiles(), fetchAbout()])

      return adaptData(
        filesResponse,
        sharedDrives,
        directory,
        query,
        isRoot && !query.cursor, // we can only show it on the first page request, or else we will have duplicates of it
        about,
      )
    })
  }

  async download ({ id: idIn, token }) {
    return this.#withErrorHandling('provider.drive.download.error', async () => {
      const client = getClient({ token })

      const { mimeType, id } = await getStats({ id: idIn, token })

      let stream

      if (isGsuiteFile(mimeType)) {
        const mimeType2 = getGsuiteExportType(mimeType)
        logger.info(`calling google file export for ${id} to ${mimeType2}`, 'provider.drive.export')
        stream = client.stream.get(`files/${encodeURIComponent(id)}/export`, { searchParams: { supportsAllDrives: true, mimeType: mimeType2 }, responseType: 'json' })
      } else {
        stream = client.stream.get(`files/${encodeURIComponent(id)}`, { searchParams: { alt: 'media', supportsAllDrives: true }, responseType: 'json' })
      }

      await prepareStream(stream)
      return { stream }
    })
  }

  // eslint-disable-next-line class-methods-use-this
  async thumbnail () {
    // not implementing this because a public thumbnail from googledrive will be used instead
    logger.error('call to thumbnail is not implemented', 'provider.drive.thumbnail.error')
    throw new Error('call to thumbnail is not implemented')
  }

  async size ({ id, token }) {
    return this.#withErrorHandling('provider.drive.size.error', async () => {
      const { mimeType, size } = await getStats({ id, token })

      if (isGsuiteFile(mimeType)) {
        // GSuite file sizes cannot be predetermined (but are max 10MB)
        // e.g. Transfer-Encoding: chunked
        return undefined
      }

      return parseInt(size, 10)
    })
  }

  logout ({ token }) {
    return this.#withErrorHandling('provider.drive.logout.error', async () => {
      await got.post('https://accounts.google.com/o/oauth2/revoke', {
        searchParams: { token },
        responseType: 'json',
      })

      return { revoked: true }
    })
  }

  async refreshToken ({ clientId, clientSecret, refreshToken }) {
    return this.#withErrorHandling('provider.drive.token.refresh.error', async () => {
      const { access_token: accessToken } = await getOauthClient().post('token', { form: { refresh_token: refreshToken, grant_type: 'refresh_token', client_id: clientId, client_secret: clientSecret } }).json()
      return { accessToken }
    })
  }

  async #withErrorHandling (tag, fn) {
    return withProviderErrorHandling({
      fn,
      tag,
      providerName: this.authProvider,
      isAuthError: (response) => response.statusCode === 401,
      getJsonErrorMessage: (body) => body?.error?.message,
    })
  }
}

module.exports = Drive
