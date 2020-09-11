const Provider = require('../Provider')

const request = require('request')
const moment = require('moment')
const purest = require('purest')({ request })
const logger = require('../../logger')
const adapter = require('./adapter')
const { ProviderApiError, ProviderAuthError } = require('../error')

const BASE_URL = 'https://zoom.us/v2'
const GET_LIST_PATH = '/users/me/recordings'
const GET_USER_PATH = '/users/me'
const PAGE_SIZE = 300
const DEFAULT_RANGE_MOS = 23
const DEAUTH_EVENT_NAME = 'app_deauthorized'

/**
 * Adapter for API https://marketplace.zoom.us/docs/api-reference/zoom-api
 */
class Zoom extends Provider {
  constructor (options) {
    super(options)
    this.authProvider = options.provider = Zoom.authProvider
    this.client = purest(options)
  }

  static get authProvider () {
    return 'zoom'
  }

  list (options, done) {
    /*
    - returns list of months by default
    - drill down for specific files in each month
    */
    const token = options.token
    const query = options.query || {}
    const { cursor, from, to } = query
    const meetingId = options.directory || ''
    let meetingsPromise = Promise.resolve(undefined)
    let recordingsPromise = Promise.resolve(undefined)

    const userPromise = new Promise((resolve, reject) => {
      this.client
        .get(`${BASE_URL}${GET_USER_PATH}`)
        .auth(token)
        .request((err, resp, body) => {
          if (err || resp.statusCode !== 200) {
            return this._listError(err, resp, done)
          }
          resolve(resp)
        })
    })

    if (from && to) {
      const queryObj = {
        page_size: PAGE_SIZE,
        from,
        to
      }

      if (cursor) {
        queryObj.next_page_token = cursor
      }

      meetingsPromise = new Promise((resolve, reject) => {
        this.client.get(`${BASE_URL}${GET_LIST_PATH}`)
          .qs(queryObj)
          .auth(token)
          .request((err, resp, body) => {
            if (err || resp.statusCode !== 200) {
              return this._listError(err, resp, done)
            } else {
              resolve(resp)
            }
          })
      })
    } else if (meetingId) {
      const GET_MEETING_FILES = `/meetings/${encodeURIComponent(meetingId)}/recordings`
      recordingsPromise = new Promise((resolve, reject) => {
        this.client
          .get(`${BASE_URL}${GET_MEETING_FILES}`)
          .auth(token)
          .request((err, resp, body) => {
            if (err || resp.statusCode !== 200) {
              return this._listError(err, resp, done)
            } else {
              resolve(resp)
            }
          })
      })
    }

    Promise.all([userPromise, meetingsPromise, recordingsPromise])
      .then(
        ([userResponse, meetingsResponse, recordingsResponse]) => {
          let returnData = null
          if (!meetingsResponse && !recordingsResponse) {
            const end = cursor && moment(cursor)
            returnData = this._initializeData(userResponse.body, end)
          } else if (meetingsResponse) {
            returnData = this._adaptData(userResponse.body, meetingsResponse.body)
          } else if (recordingsResponse) {
            returnData = this._adaptData(userResponse.body, recordingsResponse.body)
          }
          done(null, returnData)
        },
        (reqErr) => {
          done(reqErr)
        }
      )
  }

  download ({ id, token, query }, done) {
    // meeting id + file id required
    // cc files don't have an ID or size
    const meetingId = id
    const fileId = query.recordingId
    const recordingStart = query.recordingStart
    const GET_MEETING_FILES = `/meetings/${meetingId}/recordings`

    const downloadUrlPromise = new Promise((resolve) => {
      this.client
        .get(`${BASE_URL}${GET_MEETING_FILES}`)
        .auth(token)
        .request((err, resp) => {
          if (err || resp.statusCode !== 200) {
            return this._downloadError(resp, done)
          }
          const file = resp
            .body
            .recording_files
            .find(file => fileId === file.id || (file.file_type === fileId && file.recording_start === recordingStart))
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
        .on('end', () => {
          done(null, null)
        })
        .on('error', (err) => {
          logger.error(err, 'provider.zoom.download.error')
          done(err)
        })
    })
  }

  size ({ id, token, query }, done) {
    const meetingId = id
    const fileId = query.recordingId
    const recordingStart = query.recordingStart
    const GET_MEETING_FILES = `/meetings/${meetingId}/recordings`

    return this.client
      .get(`${BASE_URL}${GET_MEETING_FILES}`)
      .auth(token)
      .request((err, resp, body) => {
        if (err || resp.statusCode !== 200) {
          return this._downloadError(resp, done)
        }
        const file = resp
          .body
          .recording_files
          .find(file => file.id === fileId || (file.file_type === fileId && file.recording_start === recordingStart))

        if (!file) {
          return this._downloadError(resp, done)
        }
        const maxExportFileSize = 10 * 1024 * 1024 // 10MB
        done(null, file.file_size || maxExportFileSize)
      })
  }

  _initializeData (body, initialEnd = null) {
    let end = initialEnd || moment()
    const accountCreation = adapter.getAccountCreationDate(body)
    const defaultLimit = end.clone().subtract(DEFAULT_RANGE_MOS, 'months').date(1)
    const allResultsShown = accountCreation > defaultLimit
    const limit = allResultsShown ? accountCreation : defaultLimit
    // if the limit is mid-month, keep that exact date
    let start = (end.isSame(limit, 'month') && limit.date() !== 1) ? limit.clone() : end.clone().date(1)

    const data = {
      items: [],
      username: adapter.getUserEmail(body)
    }

    while (end.isAfter(limit)) {
      data.items.push({
        isFolder: true,
        icon: 'folder',
        name: adapter.getDateName(start, end),
        mimeType: null,
        id: adapter.getDateFolderId(start, end),
        thumbnail: null,
        requestPath: adapter.getDateFolderRequestPath(start, end),
        modifiedDate: adapter.getDateFolderModified(end),
        size: null
      })
      end = start.clone().subtract(1, 'days')
      // if the limit is mid-month, keep that exact date
      start = (end.isSame(limit, 'month') && limit.date() !== 1) ? limit.clone() : end.clone().date(1)
    }
    data.nextPagePath = allResultsShown ? null : adapter.getDateNextPagePath(end.clone())
    return data
  }

  _adaptData (userResponse, results) {
    if (!results) {
      return { items: [] }
    }

    const data = {
      nextPagePath: adapter.getNextPagePath(results),
      items: [],
      username: adapter.getUserEmail(userResponse)
    }
    const items = results.meetings || results.recording_files.filter(file => file.file_type !== 'TIMELINE')
    items.forEach(item => {
      data.items.push({
        isFolder: adapter.getIsFolder(item),
        icon: adapter.getIcon(item),
        name: adapter.getItemName(item),
        mimeType: adapter.getMimeType(item),
        id: adapter.getId(item),
        thumbnail: null,
        requestPath: adapter.getRequestPath(item),
        modifiedDate: adapter.getStartDate(item),
        size: adapter.getSize(item)
      })
    })
    return data
  }

  logout ({ companion, token }, done) {
    const { key, secret } = companion.options.providerOptions.zoom
    const encodedAuth = Buffer.from(`${key}:${secret}`, 'binary').toString('base64')

    return this.client
      .post('https://zoom.us/oauth/revoke')
      .options({
        headers: {
          Authorization: `Basic ${encodedAuth}`
        }
      })
      .qs({ token })
      .request((err, resp, body) => {
        if (err || resp.statusCode !== 200) {
          logger.error(err, 'provider.zoom.logout.error')
          done(this._error(err, resp))
          return
        }
        done(null, { revoked: (body || {}).status === 'success' })
      })
  }

  deauthorizationCallback ({ companion, body, headers }, done) {
    if (!body || body.event !== DEAUTH_EVENT_NAME) {
      return done(null, {}, 400)
    }

    const { verificationToken } = companion.options.providerOptions.zoom
    const tokenSupplied = headers.authorization
    if (!tokenSupplied || verificationToken !== tokenSupplied) {
      return done(null, {}, 400)
    }

    const { key, secret } = companion.options.providerOptions.zoom
    const encodedAuth = Buffer.from(`${key}:${secret}`, 'binary').toString('base64')

    this.client
      .post('https://api.zoom.us/oauth/data/compliance')
      .options({
        headers: {
          Authorization: `Basic ${encodedAuth}`
        }
      })
      .json({
        client_id: key,
        user_id: body.payload.user_id,
        account_id: body.payload.account_id,
        deauthorization_event_received: body.payload,
        compliance_completed: true
      })
      .request((err, resp) => {
        if (err || resp.statusCode !== 200) {
          logger.error(err, 'provider.zoom.deauth.error')
          done(this._error(err, resp))
          return
        }
        done(null, {})
      })
  }

  _error (err, resp) {
    const authErrorCodes = [
      124, // expired token
      401
    ]
    if (resp) {
      const fallbackMsg = `request to ${this.authProvider} returned ${resp.statusCode}`
      const errMsg = (resp.body || {}).message ? resp.body.message : fallbackMsg
      return authErrorCodes.indexOf(resp.statusCode) > -1 ? new ProviderAuthError() : new ProviderApiError(errMsg, resp.statusCode)
    }
    return err
  }

  _downloadError (resp, done) {
    const error = this._error(null, resp)
    logger.error(error, 'provider.zoom.download.error')
    return done(error)
  }

  _listError (err, resp, done) {
    const error = this._error(err, resp)
    logger.error(error, 'provider.zoom.list.error')
    return done(error)
  }
}

module.exports = Zoom
