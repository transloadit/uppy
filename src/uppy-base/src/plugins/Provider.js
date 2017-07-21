'use strict'

require('whatwg-fetch')

const _getName = (id) => {
  return id.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
}

module.exports = class Provider {
  constructor (core, opts) {
    this.core = core
    this.opts = opts
    this.provider = opts.provider
    this.id = this.provider
    this.authProvider = opts.authProvider || this.provider
    this.name = this.opts.name || _getName(this.id)

    this.onReceiveResponse = this.onReceiveResponse.bind(this)
  }

  get hostname () {
    const uppyServer = this.core.state.uppyServer || {}
    const host = this.opts.host
    return uppyServer[host] || host
  }

  onReceiveResponse (response) {
    const uppyServer = this.core.state.uppyServer || {}
    const host = this.opts.host
    const headers = response.headers
    // Store the self-identified domain name for the uppy-server we just hit.
    if (headers.has('i-am') && headers.get('i-am') !== uppyServer[host]) {
      this.core.setState({
        uppyServer: Object.assign({}, uppyServer, {
          [host]: headers.get('i-am')
        })
      })
    }
    return response
  }

  auth () {
    return fetch(`${this.hostname}/${this.id}/auth`, {
      method: 'get',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    .then(this.onReceiveResponse)
    .then((res) => {
      return res.json()
      .then((payload) => {
        return payload.authenticated
      })
    })
  }

  list (directory) {
    return fetch(`${this.hostname}/${this.id}/list/${directory || ''}`, {
      method: 'get',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    .then(this.onReceiveResponse)
    .then((res) => res.json())
  }

  logout (redirect = location.href) {
    return fetch(`${this.hostname}/${this.id}/logout?redirect=${redirect}`, {
      method: 'get',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
  }
}
