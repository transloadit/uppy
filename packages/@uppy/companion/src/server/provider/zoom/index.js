const Provider = require('../Provider')
const request = require('request')
const purest = require('purest')({ request })
const logger = require('../../logger')
const adapter = require('./adapter')
const moment = require('moment')
const { ProviderApiError, ProviderAuthError } = require('../error')

const BASE_URL = 'https://zoom.us/v2'
const GET_LIST_PATH = '/users/me/recordings'
const PAGE_SIZE = 300
const MAX_MO_RANGE = 3

class Zoom extends Provider {
  constructor (options) {
    super(options)
    this.authProvider = options.provider = Zoom.authProvider
    this.client = purest(options)
  }

  static get authProvider () {
    return 'zoom'
  }

  async list ({ token, query = { cursor: '', nextPageToken: '' } }, done) {
    /*
    zoom restricts retrieval to 1 month range + records for 300 meetings
      - if there's enough results to paginate, return that
      - if there's not enough, keep grabbing older records until we get the max number of results or max date range
    */
    const oldestMonth = query.cursor ? parseInt(query.cursor) : 0
    let nextPageToken = query.nextPageToken || ''
    let response = null
    const results = []
    let initialMonth = 1

    if (nextPageToken && oldestMonth) {
      initialMonth = oldestMonth
    } else if (oldestMonth) {
      initialMonth += oldestMonth + 1
    }

    let monthsPastToQuery = initialMonth
    let dateRange = this._getDateRange(monthsPastToQuery)

    while (
      !(response && response.body.next_page_token) &&
      (monthsPastToQuery - initialMonth < MAX_MO_RANGE) &&
      results.length < PAGE_SIZE
    ) {
      dateRange = this._getDateRange(monthsPastToQuery)
      const queryObj = {
        page_size: PAGE_SIZE,
        from: dateRange.fromDate,
        to: dateRange.toDate
      }
      if (nextPageToken) {
        queryObj.next_page_token = nextPageToken
      }
      try {
        response = await new Promise((resolve, reject) => this.client.get(`${BASE_URL}${GET_LIST_PATH}`)
          .qs(queryObj)
          .auth(token)
          .request((err, resp, body) => {
            if (err || resp.statusCode !== 200) {
              reject(this._error(err, resp))
            } else {
              resolve(resp)
            }
          })
        )
      } catch (err) {
        return done(err)
      }

      if (response.body.next_page_token) {
        nextPageToken = response.body.next_page_token
      } else {
        monthsPastToQuery += 1
      }
      results.push(response.body)
    }

    done(null, this._adaptData(results, dateRange))
  }

  download ({ id, token, query }, done) {
    // meeting id + file id required
    const meetingId = id
    const fileId = query.recordingId
    const GET_MEETING_FILES = `/meetings/${meetingId}/recordings`

    const downloadUrlPromise = new Promise((resolve) => {
      this.client
        .get(`${BASE_URL}${GET_MEETING_FILES}`)
        .auth(token)
        .request((err, resp) => {
          if (err) {
            this._downloadError(resp, done)
            return
          }
          const file = resp.body.recording_files.find(file => file.id === fileId)
          if (!file || !file.download_url) {
            return this._downloadError(resp, done)
          }
          resolve(file.download_url)
        })
    })
    downloadUrlPromise.then((downloadUrl) => {
      this.client
        .get(`${downloadUrl}?access_token=${token}`)
        .request()
        .on('response', (resp) => {
          if (resp.statusCode !== 200) {
            done(this._error(null, resp))
          } else {
            resp.on('data', (chunk) => done(null, chunk))
          }
        })
        .on('end', () => done(null, null))
        .on('error', (err) => {
          logger.error(err, 'provider.zoom.download.error')
          done(err)
        })
    })
  }

  size ({ id, token, query }, done) {
    const meetingId = id
    const fileId = query.recordingId
    const GET_MEETING_FILES = `/meetings/${meetingId}/recordings`

    return this.client
      .get(`${BASE_URL}${GET_MEETING_FILES}`)
      .auth(token)
      .request((err, resp, body) => {
        if (err || resp.statusCode !== 200) {
          return this._downloadError(resp, done)
        }
        const file = resp.body.recording_files.find(file => file.id === fileId)
        if (!file) {
          return this._downloadError(resp, done)
        }
        done(null, file.file_size)
      })
  }

  _adaptData (results, dateRange) {
    if (!results || results.length === 0) {
      return { items: [] }
    }

    const data = {
      nextPagePath: adapter.getQuery(results, dateRange),
      monthsRetrieved: dateRange.monthsInPast,
      items: []
    }

    results.forEach(res => {
      res.meetings.forEach(meeting => {
        meeting.recording_files.forEach((record, index) => {
          data.items.push({
            name: adapter.getItemName(meeting, record, index),
            mimeType: adapter.getMimeType(record),
            id: adapter.getId(record),
            requestPath: adapter.getRequestPath(record),
            modifiedDate: adapter.getStartDate(record),
            size: adapter.getSize(record),
            custom: adapter.getCustomFields(record)
          })
        })
      })
    })

    return data
  }

  logout ({ token }, done) {
    const encodedAuth = Buffer.from(
      `${process.env.COMPANION_ZOOM_KEY}:${process.env.COMPANION_ZOOM_SECRET}`, 'binary'
    ).toString('base64')

    return this.client
      .get('logout')
      .auth({ basic: encodedAuth })
      .qs({ token })
      .request((err, resp) => {
        if (err || resp.statusCode !== 200) {
          logger.error(err, 'provider.zoom.logout.error')
          done(this._error(err, resp))
          return
        }
        done(null, { revoked: true })
      })
  }

  _error (err, resp) {
    const customErrorCodes = [124, 401]
    if (resp) {
      const fallbackMessage = `request to ${this.authProvider} returned ${resp.statusCode}`
      const errMsg = (resp.body && resp.body.error) ? resp.body.error.message : fallbackMessage
      return customErrorCodes.indexOf(resp.statusCode) > -1 ? new ProviderAuthError() : new ProviderApiError(errMsg, resp.statusCode)
    }

    return err
  }

  _downloadError (resp, done) {
    const err = this._error(null, resp)
    logger.error(err, 'provider.zoom.download.error')
    return done(err)
  }

  _getDateRange (monthsInPast = 1) {
    return {
      fromDate: moment().subtract(monthsInPast, 'month').format('YYYY-MM-DD'),
      toDate: moment().subtract(monthsInPast - 1, 'month').format('YYYY-MM-DD'),
      monthsInPast
    }
  }
}

module.exports = Zoom
