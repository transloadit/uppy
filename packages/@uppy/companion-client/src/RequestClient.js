'use strict'

import fetchWithNetworkError from '@uppy/utils/lib/fetchWithNetworkError'
import ErrorWithCause from '@uppy/utils/lib/ErrorWithCause'
import AuthError from './AuthError.js'

import packageJson from '../package.json'

// Remove the trailing slash so we can always safely append /xyz.
function stripSlash (url) {
  return url.replace(/\/$/, '')
}

async function handleJSONResponse (res) {
  if (res.status === 401) {
    throw new AuthError()
  }

  // todo why is 300 considered success?
  // shouldn't we use res.ok?
  if (res.status >= 200 && res.status <= 300) {
    return res.json()
  }

  let errMsg = `Failed request with status: ${res.status}. ${res.statusText}`
  const errData = await res.json()
  errMsg = errData.message ? `${errMsg} message: ${errData.message}` : errMsg
  errMsg = errData.requestId ? `${errMsg} request-Id: ${errData.requestId}` : errMsg
  throw new Error(errMsg)
}

// todo pull out into core instead?
const allowedHeadersCache = new Map()

export default class RequestClient {
  static VERSION = packageJson.version

  #companionHeaders

  constructor (uppy, opts) {
    this.uppy = uppy
    this.opts = opts
    this.onReceiveResponse = this.onReceiveResponse.bind(this)
    this.#companionHeaders = opts?.companionHeaders
  }

  setCompanionHeaders (headers) {
    this.#companionHeaders = headers
  }

  [Symbol.for('uppy test: getCompanionHeaders')] () { return this.#companionHeaders }

  get hostname () {
    const { companion } = this.uppy.getState()
    const host = this.opts.companionUrl
    return stripSlash(companion && companion[host] ? companion[host] : host)
  }

  async headers () {
    const defaultHeaders = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Uppy-Versions': `@uppy/companion-client=${RequestClient.VERSION}`,
    }

    return {
      ...defaultHeaders,
      ...this.#companionHeaders,
    }
  }

  onReceiveResponse ({ headers }) {
    const state = this.uppy.getState()
    const companion = state.companion || {}
    const host = this.opts.companionUrl

    // Store the self-identified domain name for the Companion instance we just hit.
    if (headers.has('i-am') && headers.get('i-am') !== companion[host]) {
      this.uppy.setState({
        companion: { ...companion, [host]: headers.get('i-am') },
      })
    }
  }

  #getUrl (url) {
    if (/^(https?:|)\/\//.test(url)) {
      return url
    }
    return `${this.hostname}/${url}`
  }

  /*
    Preflight was added to avoid breaking change between older Companion-client versions and
    newer Companion versions and vice-versa. Usually the break will manifest via CORS errors because a
    version of companion-client could be sending certain headers to a version of Companion server that
    does not support those headers. In which case, the default preflight would lead to CORS.
    So to avoid those errors, we do preflight ourselves, to see what headers the Companion server
    we are communicating with allows. And based on that, companion-client knows what headers to
    send and what headers to not send.

    The preflight only happens once throughout the life-cycle of a certain
    Companion-client <-> Companion-server pair (allowedHeadersCache).
    Subsequent requests use the cached result of the preflight.
  */
  async preflight (path) {
    const allowedHeaders = allowedHeadersCache.get(this.hostname)
    if (allowedHeaders != null) return allowedHeaders

    const promise = (async () => {
      try {
        const response = await fetch(this.#getUrl(path), { method: 'OPTIONS' })

        const header = response.headers.get('access-control-allow-headers')
        if (header == null) return undefined

        this.uppy.log(`[CompanionClient] adding allowed preflight headers to companion cache: ${this.hostname} ${header}`)

        const allowedHeaders = header.split(',').map((headerName) => headerName.trim().toLowerCase())
        allowedHeadersCache.set(this.hostname, allowedHeaders)
        return allowedHeaders
      } catch (err) {
        this.uppy.log(`[CompanionClient] unable to make preflight request ${err}`, 'warning')
        return undefined
      }
    })()

    allowedHeadersCache.set(this.hostname, promise)

    const allowedHeadersNew = await promise
    const fallbackAllowedHeaders = ['accept', 'content-type', 'uppy-auth-token']
    return allowedHeadersNew ?? fallbackAllowedHeaders
  }

  async preflightAndHeaders (path) {
    const [allowedHeaders, headers] = await Promise.all([this.preflight(path), this.headers()])
    // filter to keep only allowed Headers
    return Object.fromEntries(Object.entries(headers).filter(([header]) => {
      if (!allowedHeaders.includes(header.toLowerCase())) {
        this.uppy.log(`[CompanionClient] excluding disallowed header ${header}`)
        return false
      }
      return true
    }))

    return headers
  }

  get = async (path, skipPostResponse) => this.#request({ path, skipPostResponse })

  post = async (path, data, skipPostResponse) => this.#request({ path, method: 'POST', data, skipPostResponse })

  delete = async (path, data, skipPostResponse) => this.#request({ path, method: 'DELETE', data, skipPostResponse })

  async #request ({ path, method = 'GET', data, skipPostResponse }) {
    try {
      const headers = await this.preflightAndHeaders(path)
      const response = await fetchWithNetworkError(this.#getUrl(path), {
        method,
        headers,
        credentials: this.opts.companionCookiesRule || 'same-origin',
        body: data ? JSON.stringify(data) : null,
      })
      if (!skipPostResponse) this.onReceiveResponse(response)
      return handleJSONResponse(response)
    } catch (err) {
      if (err?.isAuthError) throw err
      throw new ErrorWithCause(`Could not ${method} ${this.#getUrl(path)}`, { cause: err })
    }
  }
}
