'use strict'

const RequestClient = require('./RequestClient')
require('whatwg-fetch')

const _getName = (id) => {
  return id.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
}

module.exports = class Provider extends RequestClient {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.provider = opts.provider
    this.id = this.provider
    this.authProvider = opts.authProvider || this.provider
    this.name = this.opts.name || _getName(this.id)
  }

  checkAuth () {
    return this.get(`${this.id}/authorized`)
      .then((payload) => {
        return payload.authenticated
      })
  }

  authUrl () {
    return `${this.hostname}/${this.id}/connect`
  }

  fileUrl (id) {
    return `${this.hostname}/${this.id}/get/${id}`
  }

  list (directory) {
    return this.get(`${this.id}/list/${directory || ''}`)
  }

  logout (redirect = location.href) {
    return this.get(`${this.id}/logout?redirect=${redirect}`)
  }
}
