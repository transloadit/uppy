'use strict'

const RequestClient = require('./RequestClient')

const _getName = (id) => {
  return id.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
}

module.exports = class SearchProvider extends RequestClient {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.provider = opts.provider
    this.id = this.provider
    this.name = this.opts.name || _getName(this.id)
    this.pluginId = this.opts.pluginId
  }

  fileUrl (id) {
    return `${this.hostname}/search/${this.id}/get/${id}`
  }

  search (text, queries) {
    queries = queries ? `&${queries}` : ''
    return this.get(`search/${this.id}/list?q=${encodeURIComponent(text)}${queries}`)
  }
}
