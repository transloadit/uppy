'use strict'

require('whatwg-fetch')

module.exports = class Request {
  constructor (uppy, opts) {
    this.uppy = uppy
    this.opts = opts
    this.onReceiveResponse = this.onReceiveResponse.bind(this)
  }

  get hostname () {
    const uppyServer = this.uppy.state.uppyServer || {}
    const host = this.opts.host
    return uppyServer[host] || host
  }

  onReceiveResponse (response) {
    const uppyServer = this.uppy.state.uppyServer || {}
    const host = this.opts.host
    const headers = response.headers
    // Store the self-identified domain name for the uppy-server we just hit.
    if (headers.has('i-am') && headers.get('i-am') !== uppyServer[host]) {
      this.uppy.setState({
        uppyServer: Object.assign({}, uppyServer, {
          [host]: headers.get('i-am')
        })
      })
    }
    return response
  }

  get (path) {
    return fetch(`${this.hostname}/${path}`, {
      method: 'get',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
      // @todo validate response status before calling json
      .then(this.onReceiveResponse)
      .then((res) => res.json())
  }

  post (path, data) {
    fetch(`${this.hostname}/${path}`, {
      method: 'post',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
      .then(this.onReceiveResponse)
      // @todo validate response status before calling json
      .then((res) => res.json())
  }
}
