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

  const jsonPromise = res.json()

  if (res.status < 200 || res.status > 300) {
    let errMsg = `Failed request with status: ${res.status}. ${res.statusText}`
    try {
      const errData = await jsonPromise
      errMsg = errData.message ? `${errMsg} message: ${errData.message}` : errMsg
      errMsg = errData.requestId ? `${errMsg} request-Id: ${errData.requestId}` : errMsg
    } finally {
      // eslint-disable-next-line no-unsafe-finally
      throw new Error(errMsg)
    }
  }
  return jsonPromise
}

export default class RequestClient {
  static VERSION = packageJson.version

  #companionHeaders

  #getPostResponseFunc = skip => response => (skip ? response : this.onReceiveResponse(response))

  constructor (uppy, opts) {
    this.uppy = uppy
    this.opts = opts
    this.onReceiveResponse = this.onReceiveResponse.bind(this)
    this.allowedHeaders = ['accept', 'content-type', 'uppy-auth-token']
    this.preflightDone = false
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

  static defaultHeaders = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Uppy-Versions': `@uppy/companion-client=${RequestClient.VERSION}`,
  }

  headers () {
    return Promise.resolve({
      ...RequestClient.defaultHeaders,
      ...this.#companionHeaders,
    })
  }

  onReceiveResponse (response) {
    const state = this.uppy.getState()
    const companion = state.companion || {}
    const host = this.opts.companionUrl
    const { headers } = response
    // Store the self-identified domain name for the Companion instance we just hit.
    if (headers.has('i-am') && headers.get('i-am') !== companion[host]) {
      this.uppy.setState({
        companion: { ...companion, [host]: headers.get('i-am') },
      })
    }
    return response
  }

  #getUrl (url) {
    if (/^(https?:|)\/\//.test(url)) {
      return url
    }
    return `${this.hostname}/${url}`
  }

  #errorHandler (method, path) {
    return (err) => {
      if (!err?.isAuthError) {
        // eslint-disable-next-line no-param-reassign
        err = new ErrorWithCause(`Could not ${method} ${this.#getUrl(path)}`, { cause: err })
      }
      return Promise.reject(err)
    }
  }

  preflight (path) {
    if (this.preflightDone) {
      return Promise.resolve(this.allowedHeaders.slice())
    }

    return fetch(this.#getUrl(path), {
      method: 'OPTIONS',
    })
      .then((response) => {
        if (response.headers.has('access-control-allow-headers')) {
          this.allowedHeaders = response.headers.get('access-control-allow-headers')
            .split(',').map((headerName) => headerName.trim().toLowerCase())
        }
        this.preflightDone = true
        return this.allowedHeaders.slice()
      })
      .catch((err) => {
        this.uppy.log(`[CompanionClient] unable to make preflight request ${err}`, 'warning')
        this.preflightDone = true
        return this.allowedHeaders.slice()
      })
  }

  preflightAndHeaders (path) {
    return Promise.all([this.preflight(path), this.headers()])
      .then(([allowedHeaders, headers]) => {
        // filter to keep only allowed Headers
        Object.keys(headers).forEach((header) => {
          if (!allowedHeaders.includes(header.toLowerCase())) {
            this.uppy.log(`[CompanionClient] excluding disallowed header ${header}`)
            delete headers[header] // eslint-disable-line no-param-reassign
          }
        })

        return headers
      })
  }

  get (path, skipPostResponse) {
    const method = 'get'
    return this.preflightAndHeaders(path)
      .then((headers) => fetchWithNetworkError(this.#getUrl(path), {
        method,
        headers,
        credentials: this.opts.companionCookiesRule || 'same-origin',
      }))
      .then(this.#getPostResponseFunc(skipPostResponse))
      .then(handleJSONResponse)
      .catch(this.#errorHandler(method, path))
  }

  post (path, data, skipPostResponse) {
    const method = 'post'
    return this.preflightAndHeaders(path)
      .then((headers) => fetchWithNetworkError(this.#getUrl(path), {
        method,
        headers,
        credentials: this.opts.companionCookiesRule || 'same-origin',
        body: JSON.stringify(data),
      }))
      .then(this.#getPostResponseFunc(skipPostResponse))
      .then(handleJSONResponse)
      .catch(this.#errorHandler(method, path))
  }

  delete (path, data, skipPostResponse) {
    const method = 'delete'
    return this.preflightAndHeaders(path)
      .then((headers) => fetchWithNetworkError(`${this.hostname}/${path}`, {
        method,
        headers,
        credentials: this.opts.companionCookiesRule || 'same-origin',
        body: data ? JSON.stringify(data) : null,
      }))
      .then(this.#getPostResponseFunc(skipPostResponse))
      .then(handleJSONResponse)
      .catch(this.#errorHandler(method, path))
  }
}
