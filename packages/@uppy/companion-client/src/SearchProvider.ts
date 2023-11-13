'use strict'

import RequestClient from './RequestClient.ts'

const getName = (id: string) : string=> {
  return id.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
}

export default class SearchProvider extends RequestClient {
  public id: string

  constructor (uppy, opts) {
    super(uppy, opts)
    this.provider = opts.provider
    this.id = this.provider
    this.name = this.opts.name || getName(this.id)
    this.pluginId = this.opts.pluginId
  }

  fileUrl (id: string): string {
    return `${this.hostname}/search/${this.id}/get/${id}`
  }

  search (text: string, queries?: string): Promise<unknown[]> {
    return this.get(`search/${this.id}/list?q=${encodeURIComponent(text)}${queries ? `&${queries}` : ''}`)
  }
}
