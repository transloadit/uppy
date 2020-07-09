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
const DEFAULT_RANGE_MOS = 23
// oldest possible folder for any user
const OLDEST_RECORD = moment().set({ year: 2014, month: 11 })

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
    - show 2 years by default, scroll for older folders
    - drill down for rest
    */
    const token = options.token || ''
    const query = options.query || {}
    const { cursor, from, to } = query
    const meetingId = options.directory || ''

    if (!from && !to && !meetingId) {
      const end = cursor && moment(cursor)
      this.client.get(`${BASE_URL}/users/me`)
        .auth(token)
        .request((err, resp, body) => {
          if (err || resp.statusCode !== 200) {
            err = this._error(err, resp)
            logger.error(err, 'provider.zoom.list.error')
            return done(err)
          }
          done(null, this._initializeData(end))
        })
    }

    if (from && to) {
      const queryObj = {
        page_size: PAGE_SIZE,
        from,
        to
      }

      if (cursor) {
        queryObj.next_page_token = cursor
      }

      this.client.get(`${BASE_URL}${GET_LIST_PATH}`)
        .qs(queryObj)
        .auth(token)
        .request((err, resp, body) => {
          if (err || resp.statusCode !== 200) {
            err = this._error(err, resp)
            logger.error(err, 'provider.zoom.list.error')
            return done(err)
          } else {
            done(null, this._adaptData(body))
          }
        })
    }

    if (meetingId) {
      const GET_MEETING_FILES = `/meetings/${meetingId}/recordings`
      this.client
        .get(`${BASE_URL}${GET_MEETING_FILES}`)
        .auth(token)
        .request((err, resp, body) => {
          if (err || resp.statusCode !== 200) {
            err = this._error(err, resp)
            logger.error(err, 'provider.zoom.list.error')
            return done(err)
          } else {
            done(null, this._adaptData(body))
          }
        })
    }
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
          // timeline files don't have an ID
          const file = resp
            .body
            .recording_files
            .find(file => fileId === file.id || fileId === file.file_type)
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
          .find(file => file.id === fileId || file.file_type === fileId)

        if (!file) {
          return this._downloadError(resp, done)
        }
        // timeline files don't have file size, but are typically small json files, should be much less than 1MB
        const maxExportFileSize = 1024 * 1024
        done(null, file.file_size || maxExportFileSize)
      })
  }

  _initializeData (initialEnd = null) {
    let end = initialEnd || moment()
    let start = end.clone().date(1)

    const defaultLimit = end.clone().subtract('months', DEFAULT_RANGE_MOS)
    const limit = defaultLimit > OLDEST_RECORD ? defaultLimit : OLDEST_RECORD

    const data = {
      items: []
    }

    while (start > limit) {
      start = end.clone().date(1)
      data.items.push({
        isFolder: true,
        icon: 'folder',
        name: adapter.getDateName(start, end),
        mimeType: null,
        id: adapter.getDateFolderId(start, end),
        thumbnail: null,
        requestPath: adapter.getDateFolderRequestPath(start, end),
        modifiedDate: adapter.getDateFolderModified,
        size: null
      })
      end = start.clone().subtract(1, 'days')
    }
    data.nextPagePath = adapter.getDateQuery(start)
    return data
  }

  _adaptData (results) {
    if (!results || results.length === 0) {
      return { items: [] }
    }

    const data = {
      nextPagePath: adapter.getQuery(results),
      items: []
    }
    const items = results.meetings || results.recording_files
    items.forEach(item => {
      if (item.file_type && item.file_type === 'TIMELINE') {
        console.log(item.download_url)
      }
      data.items.push({
        isFolder: adapter.getIsFolder(item),
        icon: adapter.getIcon(item),
        name: adapter.getItemName(item),
        mimeType: adapter.getMimeType(item),
        id: adapter.getId(item),
        thumbnail: null,
        requestPath: adapter.getRequestPath(item),
        modifiedDate: adapter.getStartDate(item),
        size: null
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
}

module.exports = Zoom
