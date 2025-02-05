const Provider = require('../Provider')
const adaptData = require('./adapter')
const { withProviderErrorHandling } = require('../providerErrors')
const { prepareStream } = require('../../helpers/utils')
const { MAX_AGE_REFRESH_TOKEN } = require('../../helpers/jwt')

const got = require('../../got')

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

const getClient = async ({ token, rootNamespaceId }) => (await got).extend({
  prefixUrl: 'https://api.dropboxapi.com/2',
  headers: {
      authorization: `Bearer ${token}`,
      ...(rootNamespaceId && {
          'Dropbox-API-Path-Root': httpHeaderSafeJson({ ".tag": "root", "root": rootNamespaceId })
      }),
  },
})

const getOauthClient = async () => (await got).extend({
  prefixUrl: 'https://api.dropboxapi.com/oauth2',
})

async function list({ directory, query, token, rootNamespaceId }) {
  const client = await getClient({ token, rootNamespaceId })
  if (query.cursor) {
    return client.post('files/list_folder/continue', { json: { cursor: query.cursor }, responseType: 'json' }).json()
  }

  return client.post('files/list_folder', {
    searchParams: query,
    json: {
      path: `${directory || ''}`,
      include_non_downloadable_files: false,
      // min=1, max=2000 (default: 500): The maximum number of results to return per request.
      limit: 2000,
    },
    responseType: 'json',
  }).json()
}

async function userInfo ({ token }) {
  return (await getClient({ token, rootNamespaceId: null })).post('users/get_current_account', { responseType: 'json' }).json()
}

/**
 * Adapter for API https://www.dropbox.com/developers/documentation/http/documentation
 */
class DropBox extends Provider {
  constructor (options) {
    super(options)
    this.needsCookieAuth = true
    this.rootNamespaceId = null
  }

  static get oauthProvider () {
    return 'dropbox'
  }

  static get authStateExpiry () {
    return MAX_AGE_REFRESH_TOKEN
  }

  /**
   *
   * @param {object} options
   */
  async list (options) {
    return this.#withErrorHandling('provider.dropbox.list.error', async () => {
      const userInfoResponse = await userInfo(options)
      const { email, root_info } = userInfoResponse
        
      // Store rootNamespaceId as class member
      this.rootNamespaceId = root_info?.root_namespace_id

      // Then call list with the directory path and root namespace
      const stats = await list({
        ...options,
        rootNamespaceId: this.rootNamespaceId,
      })

      return adaptData(stats, email, options.companion.buildURL)
    })
  }

  async download ({ id, token }) {
    return this.#withErrorHandling('provider.dropbox.download.error', async () => {
      // Fetch rootNamespaceId if not already set
      if (!this.rootNamespaceId) {
          const userInfoResponse = await userInfo({ token })
          this.rootNamespaceId = userInfoResponse.root_info?.root_namespace_id
      }

      const stream = (await getClient({ token, rootNamespaceId: this.rootNamespaceId })).stream.post('files/download', {
        prefixUrl: 'https://content.dropboxapi.com/2',
        headers: {
          'Dropbox-API-Arg': httpHeaderSafeJson({ path: String(id) }),
          Connection: 'keep-alive', // important because https://github.com/transloadit/uppy/issues/4357
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
      // Fetch rootNamespaceId if not already set
      if (!this.rootNamespaceId) {
          const userInfoResponse = await userInfo({ token })
          this.rootNamespaceId = userInfoResponse.root_info?.root_namespace_id
      }

      const stream = (await getClient({ token, rootNamespaceId: this.rootNamespaceId })).stream.post('files/get_thumbnail_v2', {
        prefixUrl: 'https://content.dropboxapi.com/2',
        headers: { 'Dropbox-API-Arg': httpHeaderSafeJson({ resource: { '.tag': 'path', path: `${id}` }, size: 'w256h256', format: 'jpeg' }) },
        body: Buffer.alloc(0),
        responseType: 'json',
      })

      await prepareStream(stream)
      return { stream, contentType: 'image/jpeg' }
    })
  }

  async size ({ id, token }) {
    return this.#withErrorHandling('provider.dropbox.size.error', async () => {
      // Fetch rootNamespaceId if not already set
      if (!this.rootNamespaceId) {
        const userInfoResponse = await userInfo({ token })
        this.rootNamespaceId = userInfoResponse.root_info?.root_namespace_id
      }

      const { size } = await (await getClient({ token, rootNamespaceId: this.rootNamespaceId })).post('files/get_metadata', { json: { path: id }, responseType: 'json' }).json()
      return parseInt(size, 10)
    })
  }

  async logout ({ token }) {
    return this.#withErrorHandling('provider.dropbox.logout.error', async () => {
      // Fetch rootNamespaceId if not already set
      if (!this.rootNamespaceId) {
        const userInfoResponse = await userInfo({ token })
        this.rootNamespaceId = userInfoResponse.root_info?.root_namespace_id
      }    
      await (await getClient({ token, rootNamespaceId: this.rootNamespaceId })).post('auth/token/revoke', { responseType: 'json' })

      return { revoked: true }
    })
  }

  async refreshToken ({ clientId, clientSecret, refreshToken }) {
    return this.#withErrorHandling('provider.dropbox.token.refresh.error', async () => {
      const { access_token: accessToken } = await (await getOauthClient()).post('token', { form: { refresh_token: refreshToken, grant_type: 'refresh_token', client_id: clientId, client_secret: clientSecret } }).json()
      return { accessToken }
    })
  }

  // eslint-disable-next-line class-methods-use-this
  async #withErrorHandling (tag, fn) {
    return withProviderErrorHandling({
      fn,
      tag,
      providerName: DropBox.oauthProvider,
      isAuthError: (response) => response.statusCode === 401,
      getJsonErrorMessage: (body) => body?.error_summary,
    })
  }
}

module.exports = DropBox
