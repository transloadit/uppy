const got = require('got').default

const Provider = require('../Provider')
const adaptData = require('./adapter')
const { withProviderErrorHandling } = require('../providerErrors')
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

const getClient = ({ token }) => got.extend({
  prefixUrl: 'https://api.dropboxapi.com/2',
  headers: {
    authorization: `Bearer ${token}`,
  },
})

async function list ({ directory, query, token }) {
  if (query.cursor) {
    return getClient({ token }).post('files/list_folder/continue', { json: { cursor: query.cursor }, responseType: 'json' }).json()
  }

  return getClient({ token }).post('files/list_folder', { searchParams: query, json: { path: `${directory || ''}`, include_non_downloadable_files: false }, responseType: 'json' }).json()
}

async function userInfo ({ token }) {
  return getClient({ token }).post('users/get_current_account', { responseType: 'json' }).json()
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
    return this.#withErrorHandling('provider.dropbox.list.error', async () => {
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
    return this.#withErrorHandling('provider.dropbox.download.error', async () => {
      const stream = getClient({ token }).stream.post('files/download', {
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
    return this.#withErrorHandling('provider.dropbox.thumbnail.error', async () => {
      const stream = getClient({ token }).stream.post('files/get_thumbnail_v2', {
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
    return this.#withErrorHandling('provider.dropbox.size.error', async () => {
      const { size } = await getClient({ token }).post('files/get_metadata', { json: { path: id }, responseType: 'json' }).json()
      return parseInt(size, 10)
    })
  }

  async logout ({ token }) {
    return this.#withErrorHandling('provider.dropbox.logout.error', async () => {
      await getClient({ token }).post('auth/token/revoke', { responseType: 'json' })
      return { revoked: true }
    })
  }

  async #withErrorHandling (tag, fn) {
    return withProviderErrorHandling({
      fn,
      tag,
      providerName: this.authProvider,
      isAuthError: (response) => response.statusCode === 401,
      getJsonErrorMessage: (body) => body?.error_summary,
    })
  }
}

module.exports = DropBox
