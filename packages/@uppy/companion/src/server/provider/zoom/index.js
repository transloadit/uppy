const got = require('got').default
const moment = require('moment-timezone')

const Provider = require('../Provider')
const { initializeData, adaptData } = require('./adapter')
const { withProviderErrorHandling } = require('../providerErrors')
const { prepareStream, getBasicAuthHeader } = require('../../helpers/utils')

const BASE_URL = 'https://zoom.us/v2'
const PAGE_SIZE = 300
const DEAUTH_EVENT_NAME = 'app_deauthorized'

const getClient = ({ token }) => got.extend({
  prefixUrl: BASE_URL,
  headers: {
    authorization: `Bearer ${token}`,
  },
})

async function findFile ({ client, meetingId, fileId, recordingStart }) {
  const { recording_files: files } = await client.get(`meetings/${encodeURIComponent(meetingId)}/recordings`, { responseType: 'json' }).json()

  return files.find((file) => (
    fileId === file.id || (file.file_type === fileId && file.recording_start === recordingStart)
  ))
}

/**
 * Adapter for API https://marketplace.zoom.us/docs/api-reference/zoom-api
 */
class Zoom extends Provider {
  constructor (options) {
    super(options)
    this.authProvider = Zoom.authProvider
  }

  static get authProvider () {
    return 'zoom'
  }

  /*
  - returns list of months by default
  - drill down for specific files in each month
  */
  async list (options) {
    return this.#withErrorHandling('provider.zoom.list.error', async () => {
      const { token } = options
      const query = options.query || {}
      const { cursor, from, to } = query
      const meetingId = options.directory || ''

      const client = getClient({ token })
      const user = await client.get('users/me', { responseType: 'json' }).json()

      const { timezone } = user

      if (!from && !to && !meetingId) {
        const end = cursor && moment.utc(cursor).endOf('day').tz(timezone || 'UTC')
        return initializeData(user, end)
      }

      if (from && to) {
        /*  we need to convert local datetime to UTC date for Zoom query
        eg: user in PST (UTC-08:00) wants 2020-08-01 (00:00) to 2020-08-31 (23:59)
        => in UTC, that's 2020-07-31 (16:00) to 2020-08-31 (15:59)
        */
        const searchParams = {
          page_size: PAGE_SIZE,
          from: moment.tz(from, timezone || 'UTC').startOf('day').tz('UTC').format('YYYY-MM-DD'),
          to: moment.tz(to, timezone || 'UTC').endOf('day').tz('UTC').format('YYYY-MM-DD'),
        }
        if (cursor) searchParams.next_page_token = cursor

        const meetingsInfo = await client.get('users/me/recordings', { searchParams, responseType: 'json' }).json()

        return adaptData(user, meetingsInfo, query)
      }

      if (meetingId) {
        const recordingInfo = await client.get(`meetings/${encodeURIComponent(meetingId)}/recordings`, { responseType: 'json' }).json()
        return adaptData(user, recordingInfo, query)
      }

      throw new Error('Invalid list() arguments')
    })
  }

  async download ({ id: meetingId, token, query }) {
    return this.#withErrorHandling('provider.zoom.download.error', async () => {
      // meeting id + file id required
      // cc files don't have an ID or size
      const { recordingStart, recordingId: fileId } = query

      const client = getClient({ token })

      const foundFile = await findFile({ client, meetingId, fileId, recordingStart })
      const url = foundFile?.download_url
      if (!url) throw new Error('Download URL not found')

      const stream = client.stream.get(`${url}?access_token=${token}`, { prefixUrl: '', responseType: 'json' })
      await prepareStream(stream)
      return { stream }
    })
  }

  async size ({ id: meetingId, token, query }) {
    return this.#withErrorHandling('provider.zoom.size.error', async () => {
      const client = getClient({ token })
      const { recordingStart, recordingId: fileId } = query

      const foundFile = await findFile({ client, meetingId, fileId, recordingStart })
      if (!foundFile) throw new Error('File not found')
      return foundFile.file_size // Note: May be undefined.
    })
  }

  async logout ({ companion, token }) {
    return this.#withErrorHandling('provider.zoom.logout.error', async () => {
      const { key, secret } = await companion.getProviderCredentials()

      const { status } = await got.post('https://zoom.us/oauth/revoke', {
        searchParams: { token },
        headers: { Authorization: getBasicAuthHeader(key, secret) },
        responseType: 'json',
      }).json()

      return { revoked: status === 'success' }
    })
  }

  async deauthorizationCallback ({ companion, body, headers }) {
    return this.#withErrorHandling('provider.zoom.deauth.error', async () => {
      if (!body || body.event !== DEAUTH_EVENT_NAME) {
        return { data: {}, status: 400 }
      }

      const { verificationToken, key, secret } = await companion.getProviderCredentials()

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

  async #withErrorHandling (tag, fn) {
    const authErrorCodes = [
      124, // expired token
      401,
    ]

    return withProviderErrorHandling({
      fn,
      tag,
      providerName: this.authProvider,
      isAuthError: (response) => authErrorCodes.includes(response.statusCode),
      getJsonErrorMessage: (body) => body?.message,
    })
  }
}

module.exports = Zoom
