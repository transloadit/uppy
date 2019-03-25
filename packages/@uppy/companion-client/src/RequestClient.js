'use strict'

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

  get (path) {
    return new Promise((resolve, reject) => {
      this.headers().then((headers) => {
        fetch(this._getUrl(path), {
          method: 'get',
          headers: headers,
          credentials: 'same-origin'
        })
          // @todo validate response status before calling json
          .then(this.onReceiveResponse)
          .then((res) => res.json().then(resolve))
          .catch((err) => {
            reject(new Error(`Could not get ${this._getUrl(path)}. ${err}`))
          })
      })
    })
  }

  post (path, data) {
    return new Promise((resolve, reject) => {
      this.headers().then((headers) => {
        fetch(this._getUrl(path), {
          method: 'post',
          headers: headers,
          credentials: 'same-origin',
          body: JSON.stringify(data)
        })
          .then(this.onReceiveResponse)
          .then((res) => {
            if (res.status < 200 || res.status > 300) {
              reject(new Error(`Could not post ${this._getUrl(path)}. ${res.statusText}`))
              return
            }
            res.json().then(resolve)
          })
          .catch((err) => {
            reject(new Error(`Could not post ${this._getUrl(path)}. ${err}`))
          })
      })
    })
  }

  delete (path, data) {
    return new Promise((resolve, reject) => {
      this.headers().then((headers) => {
        fetch(`${this.hostname}/${path}`, {
          method: 'delete',
          headers: headers,
          credentials: 'same-origin',
          body: data ? JSON.stringify(data) : null
        })
          .then(this.onReceiveResponse)
          // @todo validate response status before calling json
          .then((res) => res.json().then(resolve))
          .catch((err) => {
            reject(new Error(`Could not delete ${this._getUrl(path)}. ${err}`))
          })
      })
    })
  }
}
