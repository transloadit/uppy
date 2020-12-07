'use strict'

const AuthError = require('./AuthError')
const fetchWithNetworkError = require('@uppy/utils/lib/fetchWithNetworkError')

// Remove the trailing slash so we can always safely append /xyz.
function stripSlash (url) {
  return url.replace(/\/$/, '')
}

module.exports = class RequestClient {
  static VERSION = require('../package.json').version

  constructor (uppy, opts) {
    this.uppy = uppy
    this.opts = opts
    this.onReceiveResponse = this.onReceiveResponse.bind(this)
  }

  get hostname () {
    const { companion } = this.uppy.getState()
    const host = this.opts.companionUrl
    return stripSlash(companion && companion[host] ? companion[host] : host)
  }

  get defaultHeaders () {
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Uppy-Versions': `@uppy/companion-client=${RequestClient.VERSION}`
    }
  }

  headers () {
    const userHeaders = this.opts.companionHeaders || this.opts.serverHeaders || {}
    return Promise.resolve({
      ...this.defaultHeaders,
      ...userHeaders
    })
  }

  _getPostResponseFunc (skip) {
    return (response) => {
      if (!skip) {
        return this.onReceiveResponse(response)
      }

      return response
    }
  }

  onReceiveResponse (response) {
    const state = this.uppy.getState()
    const companion = state.companion || {}
    const host = this.opts.companionUrl
    const headers = response.headers
    // Store the self-identified domain name for the Companion instance we just hit.
    if (headers.has('i-am') && headers.get('i-am') !== companion[host]) {
      this.uppy.setState({
        companion: Object.assign({}, companion, {
          [host]: headers.get('i-am')
        })
      })
    }
    return response
  }

  _getUrl (url) {
    if (/^(https?:|)\/\//.test(url)) {
      return url
    }
    return `${this.hostname}/${url}`
  }

  _json (res) {
    if (res.status === 401) {
      throw new AuthError()
    }

    if (res.status < 200 || res.status > 300) {
      let errMsg = `Failed request with status: ${res.status}. ${res.statusText}`
      return res.json()
        .then((errData) => {
          errMsg = errData.message ? `${errMsg} message: ${errData.message}` : errMsg
          errMsg = errData.requestId ? `${errMsg} request-Id: ${errData.requestId}` : errMsg
          throw new Error(errMsg)
        }).catch(() => {
          throw new Error(errMsg)
        })
    }
    return res.json()
  }

  get (path, skipPostResponse) {
    return fetchWithNetworkError(this._getUrl(path), {
      method: 'get',
      headers: this.headers(),
      credentials: 'same-origin'
    })
      .then(this._getPostResponseFunc(skipPostResponse))
      .then((res) => this._json(res))
      .catch((err) => {
        err = err.isAuthError ? err : new Error(`Could not get ${this._getUrl(path)}. ${err}`)
        return Promise.reject(err)
      })
  }

  post (path, data, skipPostResponse) {
    return fetchWithNetworkError(this._getUrl(path), {
      method: 'post',
      headers: this.headers(),
      credentials: 'same-origin',
      body: JSON.stringify(data)
    })
      .then(this._getPostResponseFunc(skipPostResponse))
      .then((res) => this._json(res))
      .catch((err) => {
        err = err.isAuthError ? err : new Error(`Could not post ${this._getUrl(path)}. ${err}`)
        return Promise.reject(err)
      })
  }

  delete (path, data, skipPostResponse) {
    return fetchWithNetworkError(`${this.hostname}/${path}`, {
      method: 'delete',
      headers: this.headers(),
      credentials: 'same-origin',
      body: data ? JSON.stringify(data) : null
    })
      .then(this._getPostResponseFunc(skipPostResponse))
      .then((res) => this._json(res))
      .catch((err) => {
        err = err.isAuthError ? err : new Error(`Could not delete ${this._getUrl(path)}. ${err}`)
        return Promise.reject(err)
      })
  }
}
