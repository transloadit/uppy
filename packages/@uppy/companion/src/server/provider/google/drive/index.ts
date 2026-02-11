import got from 'got'
import { MAX_AGE_REFRESH_TOKEN } from '../../../helpers/jwt.ts'
import { prepareStream } from '../../../helpers/utils.ts'
import logger from '../../../logger.ts'
import { ProviderAuthError } from '../../error.ts'
import Provider from '../../Provider.ts'
import { withGoogleErrorHandling } from '../../providerErrors.ts'
import { logout, refreshToken } from '../index.ts'
import {
  adaptData,
  type DriveAbout,
  type DriveListResponse,
  type DriveSharedDrivesResponse,
  getGsuiteExportType,
  isGsuiteFile,
  isShortcut,
  VIRTUAL_SHARED_DIR,
} from './adapter.ts'

// For testing refresh token:
// first run a download with mockAccessTokenExpiredError = true
// then when you want to test expiry, set to mockAccessTokenExpiredError to the logged access token
// This will trigger companion/nodemon to restart, and it will respond with a simulated invalid token response
const mockAccessTokenExpiredError: string | true | undefined = undefined
// const mockAccessTokenExpiredError = true
// const mockAccessTokenExpiredError = ''

const DRIVE_FILE_FIELDS =
  'kind,id,imageMediaMetadata,name,mimeType,ownedByMe,size,modifiedTime,iconLink,thumbnailLink,teamDriveId,videoMediaMetadata,exportLinks,shortcutDetails(targetId,targetMimeType)'
const DRIVE_FILES_FIELDS = `kind,nextPageToken,incompleteSearch,files(${DRIVE_FILE_FIELDS})`
// using wildcard to get all 'drive' fields because specifying fields seems no to work for the /drives endpoint
const SHARED_DRIVE_FIELDS = '*'

const getClient = ({ token }: { token: string }) =>
  got.extend({
    prefixUrl: 'https://www.googleapis.com/drive/v3',
    headers: {
      authorization: `Bearer ${token}`,
    },
  })

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

type DriveFileStats = {
  mimeType?: unknown
  id?: unknown
  exportLinks?: unknown
  shortcutDetails?: unknown
} & Record<string, unknown>

async function getStats({ id, token }: { id: string; token: string }) {
  const client = getClient({ token })

  const getStatsInner = async (statsOfId: string) =>
    client
      .get(`files/${encodeURIComponent(statsOfId)}`, {
        searchParams: { fields: DRIVE_FILE_FIELDS, supportsAllDrives: true },
        responseType: 'json',
      })
      .json<DriveFileStats>()

  const stats = await getStatsInner(id)

  // If it is a shortcut, we need to get stats again on the target
  const mimeType =
    typeof stats.mimeType === 'string' ? stats.mimeType : undefined
  if (mimeType && isShortcut(mimeType)) {
    const shortcutDetails = stats.shortcutDetails
    if (
      isRecord(shortcutDetails) &&
      typeof shortcutDetails['targetId'] === 'string'
    ) {
      return getStatsInner(shortcutDetails['targetId'])
    }
  }
  return stats
}

export async function streamGoogleFile({
  token,
  id: idIn,
}: {
  token: string
  id: string
}) {
  const client = getClient({ token })

  const stats = await getStats({ id: idIn, token })
  const mimeType = typeof stats.mimeType === 'string' ? stats.mimeType : ''
  const id = typeof stats.id === 'string' ? stats.id : `${idIn}`
  const exportLinks = isRecord(stats.exportLinks)
    ? stats.exportLinks
    : undefined

  let stream: NodeJS.ReadableStream

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
    const mimeTypeExportLink =
      exportLinks && typeof exportLinks[mimeType2] === 'string'
        ? exportLinks[mimeType2]
        : undefined
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
  static override get oauthProvider() {
    return 'googledrive'
  }

  static override get authStateExpiry() {
    return MAX_AGE_REFRESH_TOKEN
  }

  // Define these as real methods (not prototype assignment), so we don't risk
  // instance fields shadowing the prototype in downlevel transpiles.
  override logout(args: Parameters<typeof logout>[0]) {
    return logout(args)
  }

  override refreshToken(args: Parameters<typeof refreshToken>[0]) {
    return refreshToken(args)
  }

  override async list(options: unknown) {
    return withGoogleErrorHandling(
      Drive.oauthProvider,
      'provider.drive.list.error',
      async () => {
        if (!isRecord(options)) throw new Error('Invalid options')
        const directory =
          typeof options['directory'] === 'string'
            ? options['directory']
            : 'root'
        const query = isRecord(options['query']) ? options['query'] : {}
        const cursor =
          typeof query['cursor'] === 'string' ? query['cursor'] : undefined
        const providerUserSession = isRecord(options['providerUserSession'])
          ? options['providerUserSession']
          : null
        const token =
          providerUserSession &&
          typeof providerUserSession['accessToken'] === 'string'
            ? providerUserSession['accessToken']
            : undefined
        if (!token) throw new ProviderAuthError()

        const isRoot = directory === 'root'
        const isVirtualSharedDirRoot = directory === VIRTUAL_SHARED_DIR

        const client = getClient({ token })

        async function fetchSharedDrives(
          pageToken: string | null = null,
        ): Promise<DriveSharedDrivesResponse | undefined> {
          const shouldListSharedDrives = isRoot && !cursor
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
            .json<DriveSharedDrivesResponse>()

          const nextPageToken =
            typeof response['nextPageToken'] === 'string'
              ? response['nextPageToken']
              : undefined
          if (nextPageToken) {
            const nextResponse = await fetchSharedDrives(nextPageToken)
            if (!nextResponse) return response
            return {
              ...nextResponse,
              drives: [
                ...(Array.isArray(response.drives) ? response.drives : []),
                ...(Array.isArray(nextResponse.drives)
                  ? nextResponse.drives
                  : []),
              ],
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
            pageToken: cursor,
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
            .json<DriveListResponse>()
        }

        async function fetchAbout() {
          const searchParams = { fields: 'user' }

          return client
            .get('about', { searchParams, responseType: 'json' })
            .json<DriveAbout>()
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
          isRoot && !cursor, // we can only show it on the first page request, or else we will have duplicates of it
          about,
        )
      },
    )
  }

  override async download(options: unknown) {
    if (!isRecord(options) || typeof options['id'] !== 'string') {
      throw new Error('Invalid options')
    }
    const providerUserSession = isRecord(options['providerUserSession'])
      ? options['providerUserSession']
      : null
    const token =
      providerUserSession &&
      typeof providerUserSession['accessToken'] === 'string'
        ? providerUserSession['accessToken']
        : undefined
    if (!token) throw new ProviderAuthError()
    const id = options['id']

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
