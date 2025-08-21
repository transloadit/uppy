import got from 'got'
import moment from 'moment-timezone'
import pMap from 'p-map'
import { getBasicAuthHeader, prepareStream } from '../../helpers/utils.js'
import Provider from '../Provider.js'
import { withProviderErrorHandling } from '../providerErrors.js'
import adaptData from './adapter.js'

const BASE_URL = 'https://zoom.us/v2'
const PAGE_SIZE = 300
const DEAUTH_EVENT_NAME = 'app_deauthorized'

const getClient = ({ token }) =>
  got.extend({
    prefixUrl: BASE_URL,
    headers: {
      authorization: `Bearer ${token}`,
    },
  })

async function findFile({ client, meetingId, fileId, recordingStart }) {
  const { recording_files: files } = await client
    .get(`meetings/${encodeURIComponent(meetingId)}/recordings`, {
      responseType: 'json',
    })
    .json()

  return files.find(
    (file) =>
      fileId === file.id ||
      (file.file_type === fileId && file.recording_start === recordingStart),
  )
}

/**
 * Adapter for API https://marketplace.zoom.us/docs/api-reference/zoom-api
 */
export default class Zoom extends Provider {
  static get oauthProvider() {
    return 'zoom'
  }

  async list(options) {
    return this.#withErrorHandling('provider.zoom.list.error', async () => {
      const {
        providerUserSession: { accessToken: token },
      } = options
      const query = options.query || {}
      const meetingId = options.directory || ''
      const requestedYear = query.year ? parseInt(query.year, 10) : null

      const client = getClient({ token })
      const user = await client.get('users/me', { responseType: 'json' }).json()
      const { timezone } = user
      const userTz = timezone || 'UTC'

      if (meetingId) {
        const recordingInfo = await client
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

              const searchParams = {
                page_size: PAGE_SIZE,
                from: startDate.clone().tz('UTC').format('YYYY-MM-DD'),
                to: endDate.clone().tz('UTC').format('YYYY-MM-DD'),
              }

              const paginatedMeetings = []
              do {
                const currentChunkMeetingsInfo = await client
                  .get('users/me/recordings', {
                    searchParams,
                    responseType: 'json',
                  })
                  .json()
                paginatedMeetings.push(
                  ...(currentChunkMeetingsInfo.meetings ?? []),
                )
                searchParams.next_page_token =
                  currentChunkMeetingsInfo.next_page_token
              } while (searchParams.next_page_token)

              return paginatedMeetings
            },
            { concurrency: 3 },
          )
        ).flat() // this is effectively a flatMap
        // concurrency 3 seems like a sensible number...

        const finalResult = { meetings: allMeetingsInYear }
        return adaptData(user, finalResult)
      }

      const accountCreationDate = moment.utc(user.created_at)
      const startYear = accountCreationDate.year()
      const currentYear = moment.tz(userTz).year()
      const years = []

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

      return {
        username: user.email,
        items: years,
        nextPagePath: null,
      }
    })
  }

  async download({
    id: meetingId,
    providerUserSession: { accessToken: token },
    query,
  }) {
    return this.#withErrorHandling('provider.zoom.download.error', async () => {
      // meeting id + file id required
      // cc files don't have an ID or size
      const { recordingStart, recordingId: fileId } = query

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
  }) {
    return this.#withErrorHandling('provider.zoom.size.error', async () => {
      const client = getClient({ token })
      const { recordingStart, recordingId: fileId } = query

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

  async logout({ companion, providerUserSession: { accessToken: token } }) {
    return this.#withErrorHandling('provider.zoom.logout.error', async () => {
      const { key, secret } = await companion.getProviderCredentials()

      const { status } = await got
        .post('https://zoom.us/oauth/revoke', {
          searchParams: { token },
          headers: { Authorization: getBasicAuthHeader(key, secret) },
          responseType: 'json',
        })
        .json()

      return { revoked: status === 'success' }
    })
  }

  async deauthorizationCallback({ companion, body, headers }) {
    return this.#withErrorHandling('provider.zoom.deauth.error', async () => {
      if (!body || body.event !== DEAUTH_EVENT_NAME) {
        return { data: {}, status: 400 }
      }

      const { verificationToken, key, secret } =
        await companion.getProviderCredentials()

      const tokenSupplied = headers.authorization
      if (!tokenSupplied || verificationToken !== tokenSupplied) {
        return { data: {}, status: 400 }
      }

      await got.post('https://api.zoom.us/oauth/data/compliance', {
        headers: { Authorization: getBasicAuthHeader(key, secret) },
        json: {
          client_id: key,
          user_id: body.payload.user_id,
          account_id: body.payload.account_id,
          deauthorization_event_received: body.payload,
          compliance_completed: true,
        },
        responseType: 'json',
      })

      return {}
    })
  }

  async #withErrorHandling(tag, fn) {
    const authErrorCodes = [
      124, // expired token
      401,
    ]

    return withProviderErrorHandling({
      fn,
      tag,
      providerName: Zoom.oauthProvider,
      isAuthError: (response) => authErrorCodes.includes(response.statusCode),
      getJsonErrorMessage: (body) => body?.message,
    })
  }
}
