'use strict'

const RequestClient = require('./RequestClient')
const tokenStorage = require('./tokenStorage')

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
    this.pluginId = this.opts.pluginId
    this.tokenKey = `companion-${this.pluginId}-auth-token`
  }

  headers () {
    return new Promise((resolve, reject) => {
      super.headers().then((headers) => {
        this.getAuthToken().then((token) => {
          resolve(Object.assign({}, headers, { 'uppy-auth-token': token }))
        })
      }).catch(reject)
    })
  }

  onReceiveResponse (response) {
    response = super.onReceiveResponse(response)
    const authenticated = response.status !== 401
    this.uppy.getPlugin(this.pluginId).setPluginState({ authenticated })
    return response
  }

  // @todo(i.olarewaju) consider whether or not this method should be exposed
  setAuthToken (token) {
    return this.uppy.getPlugin(this.pluginId).storage.setItem(this.tokenKey, token)
  }

  getAuthToken () {
    return this.uppy.getPlugin(this.pluginId).storage.getItem(this.tokenKey)
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
    return new Promise((resolve, reject) => {
      this.get(`${this.id}/logout?redirect=${redirect}`)
        .then((res) => {
          this.uppy.getPlugin(this.pluginId).storage.removeItem(this.tokenKey)
            .then(() => resolve(res))
            .catch(reject)
        }).catch(reject)
    })
  }

  static initPlugin (plugin, opts, defaultOpts) {
    plugin.type = 'acquirer'
    plugin.files = []
    if (defaultOpts) {
      plugin.opts = Object.assign({}, defaultOpts, opts)
    }

    if (opts.serverUrl || opts.serverPattern) {
      throw new Error('`serverUrl` and `serverPattern` have been renamed to `companionUrl` and `companionAllowedHosts` respectively in 0.30.5 release. Please consult the docs (for example, https://uppy.io/docs/instagram/ for Instagram plugin) and use the updated options.`')
    }

    if (opts.companionAllowedHosts) {
      const pattern = opts.companionAllowedHosts
      // validate companionAllowedHosts param
      if (typeof pattern !== 'string' && !Array.isArray(pattern) && !(pattern instanceof RegExp)) {
        throw new TypeError(`${plugin.id}: the option "companionAllowedHosts" must be one of string, Array, RegExp`)
      }
      plugin.opts.companionAllowedHosts = pattern
    } else {
      // does not start with https://
      if (/^(?!https?:\/\/).*$/i.test(opts.companionUrl)) {
        plugin.opts.companionAllowedHosts = `https://${opts.companionUrl.replace(/^\/\//, '')}`
      } else {
        plugin.opts.companionAllowedHosts = opts.companionUrl
      }
    }

    plugin.storage = plugin.opts.storage || tokenStorage
  }
}
