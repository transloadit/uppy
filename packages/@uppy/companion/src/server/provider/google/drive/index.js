import got from 'got'
import { MAX_AGE_REFRESH_TOKEN } from '../../../helpers/jwt.js'
import { prepareStream } from '../../../helpers/utils.js'
import logger from '../../../logger.js'
import { ProviderAuthError } from '../../error.js'
import Provider from '../../Provider.js'
import { withGoogleErrorHandling } from '../../providerErrors.js'
import { logout, refreshToken } from '../index.js'
import {
  adaptData,
  getGsuiteExportType,
  isGsuiteFile,
  isShortcut,
  VIRTUAL_SHARED_DIR,
} from './adapter.js'

// For testing refresh token:
// first run a download with mockAccessTokenExpiredError = true
// then when you want to test expiry, set to mockAccessTokenExpiredError to the logged access token
// This will trigger companion/nodemon to restart, and it will respond with a simulated invalid token response
const mockAccessTokenExpiredError = undefined
// const mockAccessTokenExpiredError = true
// const mockAccessTokenExpiredError = ''

const DRIVE_FILE_FIELDS =
  'kind,id,imageMediaMetadata,name,mimeType,ownedByMe,size,modifiedTime,iconLink,thumbnailLink,teamDriveId,videoMediaMetadata,exportLinks,shortcutDetails(targetId,targetMimeType)'
const DRIVE_FILES_FIELDS = `kind,nextPageToken,incompleteSearch,files(${DRIVE_FILE_FIELDS})`
// using wildcard to get all 'drive' fields because specifying fields seems no to work for the /drives endpoint
const SHARED_DRIVE_FIELDS = '*'

const getClient = ({ token }) =>
  got.extend({
    prefixUrl: 'https://www.googleapis.com/drive/v3',
    headers: {
      authorization: `Bearer ${token}`,
    },
  })

async function getStats({ id, token }) {
  const client = getClient({ token })

  const getStatsInner = async (statsOfId) =>
    client
      .get(`files/${encodeURIComponent(statsOfId)}`, {
        searchParams: { fields: DRIVE_FILE_FIELDS, supportsAllDrives: true },
        responseType: 'json',
      })
      .json()

  const stats = await getStatsInner(id)

  // If it is a shortcut, we need to get stats again on the target
  if (isShortcut(stats.mimeType))
    return getStatsInner(stats.shortcutDetails.targetId)
  return stats
}

export async function streamGoogleFile({ token, id: idIn }) {
  const client = getClient({ token })

  const { mimeType, id, exportLinks } = await getStats({ id: idIn, token })

  let stream

  if (isGsuiteFile(mimeType)) {
    const mimeType2 = getGsuiteExportType(mimeType)
    logger.info(
      `calling google file export for ${id} to ${mimeType2}`,
      'provider.drive.export',
    )

    // GSuite files exported with large converted size results in error using standard export method.
    // Error message: "This file is too large to be exported.".
    // Issue logged in Google APIs: https://github.com/googleapis/google-api-nodejs-client/issues/3446
    // Implemented based on the answer from StackOverflow: https://stackoverflow.com/a/59168288
    const mimeTypeExportLink = exportLinks?.[mimeType2]
    if (mimeTypeExportLink) {
      stream = got.stream.get(mimeTypeExportLink, {
        headers: {
          authorization: `Bearer ${token}`,
        },
        responseType: 'json',
      })
    } else {
      stream = client.stream.get(`files/${encodeURIComponent(id)}/export`, {
        searchParams: { supportsAllDrives: true, mimeType: mimeType2 },
        responseType: 'json',
      })
    }
  } else {
    stream = client.stream.get(`files/${encodeURIComponent(id)}`, {
      searchParams: { alt: 'media', supportsAllDrives: true },
      responseType: 'json',
    })
  }

  const { size } = await prepareStream(stream)
  return { stream, size }
}

/**
 * Adapter for API https://developers.google.com/drive/api/v3/
 */
export class Drive extends Provider {
  static get oauthProvider() {
    return 'googledrive'
  }

  static get authStateExpiry() {
    return MAX_AGE_REFRESH_TOKEN
  }

  async list(options) {
    return withGoogleErrorHandling(
      Drive.oauthProvider,
      'provider.drive.list.error',
      async () => {
        const directory = options.directory || 'root'
        const query = options.query || {}
        const {
          providerUserSession: { accessToken: token },
        } = options

        const isRoot = directory === 'root'
        const isVirtualSharedDirRoot = directory === VIRTUAL_SHARED_DIR

        const client = getClient({ token })

        async function fetchSharedDrives(pageToken = null) {
          const shouldListSharedDrives = isRoot && !query.cursor
          if (!shouldListSharedDrives) return undefined

          const response = await client
            .get('drives', {
              searchParams: {
                fields: SHARED_DRIVE_FIELDS,
                pageToken,
                pageSize: 100,
              },
              responseType: 'json',
            })
            .json()

          const { nextPageToken } = response
          if (nextPageToken) {
            const nextResponse = await fetchSharedDrives(nextPageToken)
            if (!nextResponse) return response
            return {
              ...nextResponse,
              drives: [...response.drives, ...nextResponse.drives],
            }
          }

          return response
        }

        async function fetchFiles() {
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

          return client
            .get('files', { searchParams, responseType: 'json' })
            .json()
        }

        async function fetchAbout() {
          const searchParams = { fields: 'user' }

          return client
            .get('about', { searchParams, responseType: 'json' })
            .json()
        }

        const [sharedDrives, filesResponse, about] = await Promise.all([
          fetchSharedDrives(),
          fetchFiles(),
          fetchAbout(),
        ])

        return adaptData(
          filesResponse,
          sharedDrives,
          directory,
          query,
          isRoot && !query.cursor, // we can only show it on the first page request, or else we will have duplicates of it
          about,
        )
      },
    )
  }

  async download({ id, providerUserSession: { accessToken: token } }) {
    if (mockAccessTokenExpiredError != null) {
      logger.warn(`Access token: ${token}`)

      if (mockAccessTokenExpiredError === token) {
        logger.warn('Mocking expired access token!')
        throw new ProviderAuthError()
      }
    }

    return withGoogleErrorHandling(
      Drive.oauthProvider,
      'provider.drive.download.error',
      async () => {
        return streamGoogleFile({ token, id })
      },
    )
  }
}

Drive.prototype.logout = logout
Drive.prototype.refreshToken = refreshToken
