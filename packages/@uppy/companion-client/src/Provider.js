'use strict'

const RequestClient = require('./RequestClient')

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
    this.tokenKey = `companion-${this.id}-auth-token`
  }

  get defaultHeaders () {
    return Object.assign({}, super.defaultHeaders, {'uppy-auth-token': localStorage.getItem(this.tokenKey)})
  }

  // @todo(i.olarewaju) consider whether or not this method should be exposed
  setAuthToken (token) {
    // @todo(i.olarewaju) add fallback for OOM storage
    localStorage.setItem(this.tokenKey, token)
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
      .then((res) => {
        localStorage.removeItem(this.tokenKey)
        return res
      })
  }

  static initPlugin (plugin, opts, defaultOpts) {
    plugin.type = 'acquirer'
    plugin.files = []
    if (defaultOpts) {
      plugin.opts = Object.assign({}, defaultOpts, opts)
    }
    if (opts.serverPattern) {
      const pattern = opts.serverPattern
      // validate serverPattern param
      if (typeof pattern !== 'string' && !Array.isArray(pattern) && !(pattern instanceof RegExp)) {
        throw new TypeError(`${plugin.id}: the option "serverPattern" must be one of string, Array, RegExp`)
      }
      plugin.opts.serverPattern = pattern
    } else {
      // does not start with https://
      if (/^(?!https?:\/\/).*$/.test(opts.serverUrl)) {
        plugin.opts.serverPattern = `${location.protocol}//${opts.serverUrl.replace(/^\/\//, '')}`
      } else {
        plugin.opts.serverPattern = opts.serverUrl
      }
    }
  }
}
