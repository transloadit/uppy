import type { Body, Meta, Uppy } from '@uppy/core'
import type { CompanionClientSearchProvider } from '@uppy/utils'
import RequestClient, { type Opts as RequestClientOpts } from './RequestClient.js'

export interface Opts extends RequestClientOpts {
  name?: string
  provider: string
  pluginId: string
}

const getName = (id: string): string => {
  return id
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ')
}

export default class SearchProvider<M extends Meta, B extends Body>
  extends RequestClient<M, B>
  implements CompanionClientSearchProvider
{
  provider: string

  id: string

  name: string

  pluginId: string

  constructor(uppy: Uppy<M, B>, opts: Opts) {
    super(uppy, opts)
    this.provider = opts.provider
    this.id = this.provider
    this.name = opts.name || getName(this.id)
    this.pluginId = opts.pluginId
  }

  fileUrl(id: string): string {
    return `${this.hostname}/search/${this.id}/get/${id}`
  }

  search<ResBody>(text: string, queries?: string): Promise<ResBody> {
    return this.get<ResBody>(
      `search/${this.id}/list?q=${encodeURIComponent(text)}${
        queries ? `&${queries}` : ''
      }`,
    )
  }
}
