import type { UIPluginOptions } from '@uppy/core'
import type { AsyncStore } from '@uppy/core/lib/Uppy.js'

export interface CompanionPluginOptions extends UIPluginOptions {
  storage?: AsyncStore
  companionUrl: string
  companionHeaders?: Record<string, string>
  companionKeysParams?: { key: string; credentialsName: string }
  companionCookiesRule?: 'same-origin' | 'include'
  companionAllowedHosts?: string | RegExp | (string | RegExp)[]
}
