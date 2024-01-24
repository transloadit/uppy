'use strict'

import type { Body, Meta } from '@uppy/utils/lib/UppyFile.ts'
import type { Uppy } from '@uppy/core'
import RequestClient, { type Opts } from './RequestClient.ts'

const getName = (id: string): string => {
  return id
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ')
}

export default class SearchProvider<
  M extends Meta,
  B extends Body,
> extends RequestClient<M, B> {
  provider: string

  id: string

  name: string

  pluginId: string

  constructor(uppy: Uppy<M, B>, opts: Opts) {
    super(uppy, opts)
    this.provider = opts.provider
    this.id = this.provider
    this.name = this.opts.name || getName(this.id)
    this.pluginId = this.opts.pluginId
  }

  fileUrl(id: string): string {
    return `${this.hostname}/search/${this.id}/get/${id}`
  }

  search<ResBody extends Record<string, unknown>>(
    text: string,
    queries?: string,
  ): Promise<ResBody> {
    return this.get<ResBody>(
      `search/${this.id}/list?q=${encodeURIComponent(text)}${
        queries ? `&${queries}` : ''
      }`,
    )
  }
}
