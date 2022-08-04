const request = require('request')
const purest = require('purest')({ request })
const { promisify } = require('node:util')

const Provider = require('../Provider')
const logger = require('../../logger')
const adapter = require('./adapter')
const { ProviderApiError, ProviderAuthError } = require('../error')
const { requestStream } = require('../../helpers/utils')

// From https://www.dropbox.com/developers/reference/json-encoding:
//
// This function is simple and has OK performance compared to more
// complicated ones: http://jsperf.com/json-escape-unicode/4
const charsToEncode = /[\u007f-\uffff]/g
function httpHeaderSafeJson (v) {
  return JSON.stringify(v).replace(charsToEncode,
    (c) => {
      return `\\u${(`000${c.charCodeAt(0).toString(16)}`).slice(-4)}`
    })
}

function adaptData (res, email, buildURL) {
  const items = adapter.getItemSubList(res).map((item) => ({
    isFolder: adapter.isFolder(item),
    icon: adapter.getItemIcon(item),
    name: adapter.getItemName(item),
    mimeType: adapter.getMimeType(item),
    id: adapter.getItemId(item),
    thumbnail: buildURL(adapter.getItemThumbnailUrl(item), true),
    requestPath: adapter.getItemRequestPath(item),
    modifiedDate: adapter.getItemModifiedDate(item),
    size: adapter.getItemSize(item),
  }))
  items.sort((a, b) => a.name.localeCompare(b.name, 'en-US', { numeric: true }))

  return {
    username: email,
    items,
    nextPagePath: adapter.getNextPagePath(res),
  }
}

/**
 * Adapter for API https://www.dropbox.com/developers/documentation/http/documentation
 */
class DropBox extends Provider {
  constructor (options) {
    super(options)
    this.authProvider = DropBox.authProvider
    this.client = purest({
      ...options,
      provider: DropBox.authProvider,
    })
    // needed for the thumbnails fetched via companion
    this.needsCookieAuth = true
  }

  static get authProvider () {
    return 'dropbox'
  }

  async _userInfo ({ token }) {
    const client = this.client
      .post('users/get_current_account')
      .options({ version: '2' })
      .auth(token)
    return promisify(client.request.bind(client))()
  }

  /**
   *
   * @param {object} options
   */
  async list (options) {
    try {
      const responses = await Promise.all([
        this._stats(options),
        this._userInfo(options),
      ])
      responses.forEach((response) => {
        if (response.statusCode !== 200) throw this._error(null, response)
      })
      const [{ body: stats }, { body: { email } }] = responses
      return adaptData(stats, email, options.companion.buildURL)
    } catch (err) {
      logger.error(err, 'provider.dropbox.list.error')
      throw err
    }
  }

  async _stats ({ directory, query, token }) {
    if (query.cursor) {
      const client = this.client
        .post('files/list_folder/continue')
        .options({ version: '2' })
        .auth(token)
        .json({
          cursor: query.cursor,
        })
      return promisify(client.request.bind(client))()
    }

    const client = this.client
      .post('files/list_folder')
      .options({ version: '2' })
      .qs(query)
      .auth(token)
      .json({
        path: `${directory || ''}`,
        include_non_downloadable_files: false,
      })

    return promisify(client.request.bind(client))()
  }

  async download ({ id, token }) {
    try {
      const req = this.client
        .post('https://content.dropboxapi.com/2/files/download')
        .options({
          version: '2',
          headers: {
            'Dropbox-API-Arg': httpHeaderSafeJson({ path: `${id}` }),
          },
        })
        .auth(token)
        .request()

      return await requestStream(req, async (res) => this._error(null, res))
    } catch (err) {
      logger.error(err, 'provider.dropbox.download.error')
      throw err
    }
  }

  async thumbnail ({ id, token }) {
    try {
      const req = this.client
        .post('https://content.dropboxapi.com/2/files/get_thumbnail_v2')
        .options({
          headers: {
            'Dropbox-API-Arg': httpHeaderSafeJson({ resource: { '.tag': 'path', path: `${id}` }, size: 'w256h256' }),
          },
        })
        .auth(token)
        .request()

      return await requestStream(req, (resp) => this._error(null, resp))
    } catch (err) {
      logger.error(err, 'provider.dropbox.thumbnail.error')
      throw err
    }
  }

  async size ({ id, token }) {
    const client = this.client
      .post('files/get_metadata')
      .options({ version: '2' })
      .auth(token)
      .json({ path: id })

    try {
      const resp = await promisify(client.request.bind(client))()
      if (resp.statusCode !== 200) throw this._error(null, resp)
      return parseInt(resp.body.size, 10)
    } catch (err) {
      logger.error(err, 'provider.dropbox.size.error')
      throw err
    }
  }

  async logout ({ token }) {
    const client = this.client
      .post('auth/token/revoke')
      .options({ version: '2' })
      .auth(token)

    try {
      const resp = await promisify(client.request.bind(client))()
      if (resp.statusCode !== 200) throw this._error(null, resp)
      return { revoked: true }
    } catch (err) {
      logger.error(err, 'provider.dropbox.logout.error')
      throw err
    }
  }

  _error (err, resp) {
    if (resp) {
      const fallbackMessage = `request to ${this.authProvider} returned ${resp.statusCode}`
      const errMsg = (resp.body || {}).error_summary ? resp.body.error_summary : fallbackMessage
      return resp.statusCode === 401 ? new ProviderAuthError() : new ProviderApiError(errMsg, resp.statusCode)
    }

    return err
  }
}

DropBox.version = 2

module.exports = DropBox
