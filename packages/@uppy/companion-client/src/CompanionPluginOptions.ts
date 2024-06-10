import type { UIPluginOptions } from '@uppy/core'
import type { tokenStorage } from './index.js'

export interface CompanionPluginOptions extends UIPluginOptions {
  title?: string
  storage?: typeof tokenStorage
  companionUrl: string
  companionHeaders?: Record<string, string>
  companionKeysParams?: Record<string, string>
  companionCookiesRule?: 'same-origin' | 'include'
  companionAllowedHosts?: string | RegExp | (string | RegExp)[]
}
