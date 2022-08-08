const got = require('got').default

const Provider = require('../Provider')
const logger = require('../../logger')
const adapter = require('./adapter')
const { ProviderApiError, ProviderAuthError } = require('../error')
const { prepareStream } = require('../../helpers/utils')

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

const getClient = async ({ token }) => got.extend({
  prefixUrl: 'https://api.dropboxapi.com/2',
  headers: {
    authorization: `Bearer ${token}`,
  },
})

async function list ({ directory, query, token }) {
  if (query.cursor) {
    const client = await getClient({ token })
    return client.post('files/list_folder/continue', { json: { cursor: query.cursor }, responseType: 'json' }).json()
  }

  const client = await getClient({ token })
  return client.post('files/list_folder', { searchParams: query, json: { path: `${directory || ''}`, include_non_downloadable_files: false }, responseType: 'json' }).json()
}

async function userInfo ({ token }) {
  const client = await getClient({ token })
  return client.post('users/get_current_account', { responseType: 'json' }).json()
}

/**
 * Adapter for API https://www.dropbox.com/developers/documentation/http/documentation
 */
class DropBox extends Provider {
  constructor (options) {
    super(options)
    this.authProvider = DropBox.authProvider
    // needed for the thumbnails fetched via companion
    this.needsCookieAuth = true
  }

  static get authProvider () {
    return 'dropbox'
  }

  /**
   *
   * @param {object} options
   */
  async list (options) {
    return this.withErrorHandling('provider.dropbox.list.error', async () => {
      const responses = await Promise.all([
        list(options),
        userInfo(options),
      ])
      // @ts-ignore
      const [stats, { email }] = responses
      return adaptData(stats, email, options.companion.buildURL)
    })
  }

  async download ({ id, token }) {
    return this.withErrorHandling('provider.dropbox.download.error', async () => {
      const client = await getClient({ token })
      const stream = client.stream.post('files/download', {
        prefixUrl: 'https://content.dropboxapi.com/2',
        headers: {
          'Dropbox-API-Arg': httpHeaderSafeJson({ path: String(id) }),
        },
        body: Buffer.alloc(0), // if not, it will hang waiting for the writable stream
        responseType: 'json',
      })

      await prepareStream(stream)
      return { stream }
    })
  }

  async thumbnail ({ id, token }) {
    return this.withErrorHandling('provider.dropbox.thumbnail.error', async () => {
      const client = await getClient({ token })
      const stream = client.stream.post('files/get_thumbnail_v2', {
        prefixUrl: 'https://content.dropboxapi.com/2',
        headers: { 'Dropbox-API-Arg': httpHeaderSafeJson({ resource: { '.tag': 'path', path: `${id}` }, size: 'w256h256' }) },
        body: Buffer.alloc(0),
        responseType: 'json',
      })

      await prepareStream(stream)
      return { stream }
    })
  }

  async size ({ id, token }) {
    return this.withErrorHandling('provider.dropbox.size.error', async () => {
      const client = await getClient({ token })
      const { size } = await client.post('files/get_metadata', { json: { path: id }, responseType: 'json' }).json()
      return parseInt(size, 10)
    })
  }

  async logout ({ token }) {
    return this.withErrorHandling('provider.dropbox.logout.error', async () => {
      const client = await getClient({ token })
      await client.post('auth/token/revoke', { responseType: 'json' })
      return { revoked: true }
    })
  }

  // todo reuse
  async withErrorHandling (tag, fn) {
    try {
      return await fn()
    } catch (err) {
      const err2 = this.#convertError(err)
      logger.error(err2, tag)
      throw err2
    }
  }

  #convertError (err) {
    const { response } = err
    if (response) {
      const fallbackMessage = `request to ${this.authProvider} returned ${response.statusCode}`
      let errMsg
      if (typeof response.body === 'object' && response.body.error_summary) errMsg = response.body.error_summary
      else if (typeof response.body === 'string') errMsg = response.body
      else errMsg = fallbackMessage

      return response.statusCode === 401 ? new ProviderAuthError() : new ProviderApiError(errMsg, response.statusCode)
    }

    return err
  }
}

module.exports = DropBox
