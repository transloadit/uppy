'use strict'

const AuthError = require('./AuthError')

// Remove the trailing slash so we can always safely append /xyz.
function stripSlash (url) {
  return url.replace(/\/$/, '')
}

module.exports = class RequestClient {
  constructor (uppy, opts) {
    this.uppy = uppy
    this.opts = opts
    this.onReceiveResponse = this.onReceiveResponse.bind(this)
  }

  get hostname () {
    const { companion } = this.uppy.getState()
    const host = this.opts.serverUrl
    return stripSlash(companion && companion[host] ? companion[host] : host)
  }

  get defaultHeaders () {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }

  headers () {
    return Promise.resolve(Object.assign({}, this.defaultHeaders, this.opts.serverHeaders || {}))
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
    const host = this.opts.serverUrl
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
      throw new Error(`Failed request to ${res.url}. ${res.statusText}`)
    }
    return res.json()
  }

  get (path, skipPostResponse) {
    return new Promise((resolve, reject) => {
      this.headers().then((headers) => {
        fetch(this._getUrl(path), {
          method: 'get',
          headers: headers,
          credentials: 'same-origin'
        })
          .then(this._getPostResponseFunc(skipPostResponse))
          .then((res) => this._json(res).then(resolve))
          .catch((err) => {
            err = err.isAuthError ? err : new Error(`Could not get ${this._getUrl(path)}. ${err}`)
            reject(err)
          })
      })
    })
  }

  post (path, data, skipPostResponse) {
    return new Promise((resolve, reject) => {
      this.headers().then((headers) => {
        fetch(this._getUrl(path), {
          method: 'post',
          headers: headers,
          credentials: 'same-origin',
          body: JSON.stringify(data)
        })
          .then(this._getPostResponseFunc(skipPostResponse))
          .then((res) => this._json(res).then(resolve))
          .catch((err) => {
            err = err.isAuthError ? err : new Error(`Could not post ${this._getUrl(path)}. ${err}`)
            reject(err)
          })
      })
    })
  }

  delete (path, data, skipPostResponse) {
    return new Promise((resolve, reject) => {
      this.headers().then((headers) => {
        fetch(`${this.hostname}/${path}`, {
          method: 'delete',
          headers: headers,
          credentials: 'same-origin',
          body: data ? JSON.stringify(data) : null
        })
          .then(this._getPostResponseFunc(skipPostResponse))
          .then((res) => this._json(res).then(resolve))
          .catch((err) => {
            err = err.isAuthError ? err : new Error(`Could not delete ${this._getUrl(path)}. ${err}`)
            reject(err)
          })
      })
    })
  }
}
