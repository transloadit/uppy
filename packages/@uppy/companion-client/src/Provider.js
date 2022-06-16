'use strict'

import RequestClient from './RequestClient.js'
import * as tokenStorage from './tokenStorage.js'

const getName = (id) => {
  return id.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
}

export default class Provider extends RequestClient {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.provider = opts.provider
    this.id = this.provider
    this.name = this.opts.name || getName(this.id)
    this.pluginId = this.opts.pluginId
    this.tokenKey = `companion-${this.pluginId}-auth-token`
    this.companionKeysParams = this.opts.companionKeysParams
    this.preAuthToken = null
  }

  headers () {
    return Promise.all([super.headers(), this.getAuthToken()])
      .then(([headers, token]) => {
        const authHeaders = {}
        if (token) {
          authHeaders['uppy-auth-token'] = token
        }

        if (this.companionKeysParams) {
          authHeaders['uppy-credentials-params'] = btoa(
            JSON.stringify({ params: this.companionKeysParams }),
          )
        }
        return { ...headers, ...authHeaders }
      })
  }

  onReceiveResponse (response) {
    response = super.onReceiveResponse(response) // eslint-disable-line no-param-reassign
    const plugin = this.uppy.getPlugin(this.pluginId)
    const oldAuthenticated = plugin.getPluginState().authenticated
    const authenticated = oldAuthenticated ? response.status !== 401 : response.status < 400
    plugin.setPluginState({ authenticated })
    return response
  }

  setAuthToken (token) {
    return this.uppy.getPlugin(this.pluginId).storage.setItem(this.tokenKey, token)
  }

  getAuthToken () {
    return this.uppy.getPlugin(this.pluginId).storage.getItem(this.tokenKey)
  }

  /**
   * Ensure we have a preauth token if necessary. Attempts to fetch one if we don't,
   * or rejects if loading one fails.
   */
  async ensurePreAuth () {
    if (this.companionKeysParams && !this.preAuthToken) {
      await this.fetchPreAuthToken()

      if (!this.preAuthToken) {
        throw new Error('Could not load authentication data required for third-party login. Please try again later.')
      }
    }
  }

  authUrl (queries = {}) {
    const params = new URLSearchParams(queries)
    if (this.preAuthToken) {
      params.set('uppyPreAuthToken', this.preAuthToken)
    }

    return `${this.hostname}/${this.id}/connect?${params}`
  }

  fileUrl (id) {
    return `${this.hostname}/${this.id}/get/${id}`
  }

  async fetchPreAuthToken () {
    if (!this.companionKeysParams) {
      return
    }

    try {
      const res = await this.post(`${this.id}/preauth/`, { params: this.companionKeysParams })
      this.preAuthToken = res.token
    } catch (err) {
      this.uppy.log(`[CompanionClient] unable to fetch preAuthToken ${err}`, 'warning')
    }
  }

  list (directory) {
    return this.get(`${this.id}/list/${directory || ''}`)
  }

  logout () {
    return this.get(`${this.id}/logout`)
      .then((response) => Promise.all([
        response,
        this.uppy.getPlugin(this.pluginId).storage.removeItem(this.tokenKey),
      ])).then(([response]) => response)
  }

  static initPlugin (plugin, opts, defaultOpts) {
    /* eslint-disable no-param-reassign */
    plugin.type = 'acquirer'
    plugin.files = []
    if (defaultOpts) {
      plugin.opts = { ...defaultOpts, ...opts }
    }

    if (opts.serverUrl || opts.serverPattern) {
      throw new Error('`serverUrl` and `serverPattern` have been renamed to `companionUrl` and `companionAllowedHosts` respectively in the 0.30.5 release. Please consult the docs (for example, https://uppy.io/docs/instagram/ for the Instagram plugin) and use the updated options.`')
    }

    if (opts.companionAllowedHosts) {
      const pattern = opts.companionAllowedHosts
      // validate companionAllowedHosts param
      if (typeof pattern !== 'string' && !Array.isArray(pattern) && !(pattern instanceof RegExp)) {
        throw new TypeError(`${plugin.id}: the option "companionAllowedHosts" must be one of string, Array, RegExp`)
      }
      plugin.opts.companionAllowedHosts = pattern
    } else if (/^(?!https?:\/\/).*$/i.test(opts.companionUrl)) {
      // does not start with https://
      plugin.opts.companionAllowedHosts = `https://${opts.companionUrl.replace(/^\/\//, '')}`
    } else {
      plugin.opts.companionAllowedHosts = new URL(opts.companionUrl).origin
    }

    plugin.storage = plugin.opts.storage || tokenStorage
    /* eslint-enable no-param-reassign */
  }
}
