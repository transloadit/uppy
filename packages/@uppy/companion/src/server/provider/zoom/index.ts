import got from 'got'
import moment from 'moment-timezone'
import pMap from 'p-map'
import { isRecord } from '../../helpers/type-guards.ts'
import { getBasicAuthHeader, prepareStream } from '../../helpers/utils.ts'
import Provider from '../Provider.ts'
import { withProviderErrorHandling } from '../providerErrors.ts'
import adaptData from './adapter.ts'

const BASE_URL = 'https://zoom.us/v2'
const PAGE_SIZE = 300
const DEAUTH_EVENT_NAME = 'app_deauthorized'

type ZoomClient = ReturnType<typeof got.extend>

const getClient = ({ token }: { token: string }): ZoomClient =>
  got.extend({
    prefixUrl: BASE_URL,
    headers: {
      authorization: `Bearer ${token}`,
    },
  })

type ZoomFoundFile = {
  download_url?: string
  file_size?: number
  id?: string
  file_type?: string
  recording_start?: string
}

async function findFile({
  client,
  meetingId,
  fileId,
  recordingStart,
}: {
  client: ZoomClient
  meetingId: string
  fileId: string
  recordingStart?: string
}): Promise<ZoomFoundFile | undefined> {
  const body: unknown = await client
    .get(`meetings/${encodeURIComponent(meetingId)}/recordings`, {
      responseType: 'json',
    })
    .json()

  const filesValue = isRecord(body) ? body.recording_files : undefined
  const files = Array.isArray(filesValue) ? filesValue : []

  for (const file of files) {
    if (!isRecord(file)) continue
    const id = typeof file.id === 'string' ? file.id : undefined
    const fileType =
      typeof file.file_type === 'string' ? file.file_type : undefined
    const recStart =
      typeof file.recording_start === 'string'
        ? file.recording_start
        : undefined

    const matches =
      (id != null && fileId === id) ||
      (fileType != null &&
        file.file_type === fileId &&
        recStart != null &&
        recStart === recordingStart)

    if (!matches) continue

    return {
      download_url:
        typeof file.download_url === 'string' ? file.download_url : undefined,
      file_size:
        typeof file.file_size === 'number' ? file.file_size : undefined,
      id,
      file_type: fileType,
      recording_start: recStart,
    }
  }

  return undefined
}

/**
 * Adapter for API https://marketplace.zoom.us/docs/api-reference/zoom-api
 */
export default class Zoom extends Provider {
  static get oauthProvider() {
    return 'zoom'
  }

  async list(options: {
    providerUserSession: { accessToken: string }
    query?: unknown
    directory?: string
  }): Promise<unknown> {
    return this.#withErrorHandling('provider.zoom.list.error', async () => {
      const {
        providerUserSession: { accessToken: token },
      } = options
      const query = isRecord(options.query) ? options.query : {}
      const meetingId = options.directory || ''
      const requestedYear =
        typeof query.year === 'string' ? parseInt(query.year, 10) : null

      const client = getClient({ token })
      const userRaw: unknown = await client
        .get('users/me', { responseType: 'json' })
        .json()
      const userObj: Record<string, unknown> = isRecord(userRaw) ? userRaw : {}
      const user: Parameters<typeof adaptData>[0] = {
        email: typeof userObj.email === 'string' ? userObj.email : undefined,
        timezone:
          typeof userObj.timezone === 'string' ? userObj.timezone : undefined,
      }
      const timezone = user.timezone ?? null
      const userTz = timezone || 'UTC'

      if (meetingId) {
        const recordingInfo: unknown = await client
          .get(`meetings/${encodeURIComponent(meetingId)}/recordings`, {
            responseType: 'json',
          })
          .json()
        return adaptData(user, recordingInfo)
      }

      if (requestedYear) {
        const now = moment.tz(userTz)
        const numMonths =
          now.get('year') === requestedYear ? now.get('month') + 1 : 12
        const monthsToCheck = Array.from({ length: numMonths }, (_, i) => i) // in moment, months are 0-indexed

        // Run each month in parallel:
        const allMeetingsInYear = (
          await pMap(
            monthsToCheck,
            async (month) => {
              const startDate = moment
                .tz({ year: requestedYear, month, day: 1 }, userTz)
                .startOf('month')
              const endDate = startDate.clone().endOf('month')

              const searchParams = new URLSearchParams({
                page_size: String(PAGE_SIZE),
                from: startDate.clone().tz('UTC').format('YYYY-MM-DD'),
                to: endDate.clone().tz('UTC').format('YYYY-MM-DD'),
              })

              const paginatedMeetings: unknown[] = []
              let nextPageToken: string | null = null
              do {
                const currentChunkMeetingsInfo: unknown = await client
                  .get('users/me/recordings', {
                    searchParams,
                    responseType: 'json',
                  })
                  .json()
                paginatedMeetings.push(
                  ...(isRecord(currentChunkMeetingsInfo) &&
                  Array.isArray(currentChunkMeetingsInfo.meetings)
                    ? currentChunkMeetingsInfo.meetings
                    : []),
                )
                const tokenValue = isRecord(currentChunkMeetingsInfo)
                  ? currentChunkMeetingsInfo.next_page_token
                  : undefined
                nextPageToken =
                  typeof tokenValue === 'string' && tokenValue.length > 0
                    ? tokenValue
                    : null
                if (nextPageToken) {
                  searchParams.set('next_page_token', nextPageToken)
                } else {
                  searchParams.delete('next_page_token')
                }
              } while (nextPageToken)

              return paginatedMeetings
            },
            { concurrency: 3 },
          )
        ).flat() // this is effectively a flatMap
        // concurrency 3 seems like a sensible number...

        const finalResult = { meetings: allMeetingsInYear }
        return adaptData(user, finalResult)
      }

      const accountCreationDate = moment.utc(
        typeof userObj.created_at === 'string' ? userObj.created_at : undefined,
      )
      const startYear = accountCreationDate.year()
      const currentYear = moment.tz(userTz).year()
      const years: Array<{
        isFolder: true
        icon: 'folder'
        name: string
        mimeType: null
        id: string
        thumbnail: null
        requestPath: string
        modifiedDate: string
        size: null
      }> = []

      for (let year = currentYear; year >= startYear; year--) {
        years.push({
          isFolder: true,
          icon: 'folder',
          name: `${year}`,
          mimeType: null,
          id: `${year}`,
          thumbnail: null,
          requestPath: `?year=${year}`,
          modifiedDate: `${year}-12-31`, // Representative date
          size: null,
        })
      }

      const response: {
        username: string | null
        items: typeof years
        nextPagePath: null
      } = {
        username: user.email ?? null,
        items: years,
        nextPagePath: null,
      }

      return response
    })
  }

  async download({
    id: meetingId,
    providerUserSession: { accessToken: token },
    query,
  }: {
    id: string
    providerUserSession: { accessToken: string }
    query: unknown
  }): Promise<unknown> {
    return this.#withErrorHandling('provider.zoom.download.error', async () => {
      // meeting id + file id required
      // cc files don't have an ID or size
      const recordingStart =
        isRecord(query) && typeof query.recordingStart === 'string'
          ? query.recordingStart
          : undefined
      const fileId =
        isRecord(query) && typeof query.recordingId === 'string'
          ? query.recordingId
          : ''
      if (!fileId) throw new Error('Missing recordingId')

      const client = getClient({ token })

      const foundFile = await findFile({
        client,
        meetingId,
        fileId,
        recordingStart,
      })
      const url = foundFile?.download_url
      if (!url) throw new Error('Download URL not found')

      const stream = client.stream.get(`${url}?access_token=${token}`, {
        prefixUrl: '',
        responseType: 'json',
      })
      const { size } = await prepareStream(stream)
      return { stream, size }
    })
  }

  async size({
    id: meetingId,
    providerUserSession: { accessToken: token },
    query,
  }: {
    id: string
    providerUserSession: { accessToken: string }
    query: unknown
  }): Promise<number | undefined> {
    return this.#withErrorHandling('provider.zoom.size.error', async () => {
      const client = getClient({ token })
      const recordingStart =
        isRecord(query) && typeof query.recordingStart === 'string'
          ? query.recordingStart
          : undefined
      const fileId =
        isRecord(query) && typeof query.recordingId === 'string'
          ? query.recordingId
          : ''
      if (!fileId) throw new Error('Missing recordingId')

      const foundFile = await findFile({
        client,
        meetingId,
        fileId,
        recordingStart,
      })
      if (!foundFile) throw new Error('File not found')
      return foundFile.file_size // Note: May be undefined.
    })
  }

  async logout({
    companion,
    providerUserSession: { accessToken: token },
  }: {
    companion: {
      getProviderCredentials: () => Promise<Record<string, unknown>>
    }
    providerUserSession: { accessToken: string }
  }): Promise<{ revoked: boolean }> {
    return this.#withErrorHandling('provider.zoom.logout.error', async () => {
      const { key, secret } = await companion.getProviderCredentials()
      if (typeof key !== 'string' || typeof secret !== 'string') {
        throw new Error('Missing Zoom credentials')
      }

      const body: unknown = await got
        .post('https://zoom.us/oauth/revoke', {
          searchParams: { token },
          headers: { Authorization: getBasicAuthHeader(key, secret) },
          responseType: 'json',
        })
        .json()

      const status =
        isRecord(body) && typeof body.status === 'string' ? body.status : null
      return { revoked: status === 'success' }
    })
  }

  async deauthorizationCallback({
    companion,
    body,
    headers,
  }: {
    companion: {
      getProviderCredentials: () => Promise<Record<string, unknown>>
    }
    body: unknown
    headers: Record<string, string | undefined>
  }): Promise<Record<string, unknown>> {
    return this.#withErrorHandling('provider.zoom.deauth.error', async () => {
      if (!isRecord(body) || body.event !== DEAUTH_EVENT_NAME) {
        return { data: {}, status: 400 }
      }

      const { verificationToken, key, secret } =
        await companion.getProviderCredentials()
      if (
        typeof verificationToken !== 'string' ||
        typeof key !== 'string' ||
        typeof secret !== 'string'
      ) {
        return { data: {}, status: 400 }
      }

      const tokenSupplied = headers.authorization
      if (!tokenSupplied || verificationToken !== tokenSupplied) {
        return { data: {}, status: 400 }
      }

      const payload = body.payload
      if (!isRecord(payload)) return { data: {}, status: 400 }
      const userId = payload.user_id
      const accountId = payload.account_id
      if (typeof userId !== 'string' || typeof accountId !== 'string') {
        return { data: {}, status: 400 }
      }

      await got.post('https://api.zoom.us/oauth/data/compliance', {
        headers: { Authorization: getBasicAuthHeader(key, secret) },
        json: {
          client_id: key,
          user_id: userId,
          account_id: accountId,
          deauthorization_event_received: payload,
          compliance_completed: true,
        },
        responseType: 'json',
      })

      return {}
    })
  }

  async #withErrorHandling<T>(tag: string, fn: () => Promise<T>): Promise<T> {
    const authErrorCodes = [
      124, // expired token
      401,
    ]

    return withProviderErrorHandling({
      fn,
      tag,
      providerName: Zoom.oauthProvider,
      isAuthError: (response: { statusCode?: number }) =>
        typeof response.statusCode === 'number' &&
        authErrorCodes.includes(response.statusCode),
      getJsonErrorMessage: (body) =>
        isRecord(body) && typeof body.message === 'string'
          ? body.message
          : undefined,
    })
  }
}
