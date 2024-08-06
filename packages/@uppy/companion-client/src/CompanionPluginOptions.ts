import type { UIPluginOptions } from '@uppy/core'
import type { tokenStorage } from './index.ts'

export interface CompanionPluginOptions extends UIPluginOptions {
  storage?: typeof tokenStorage
  companionUrl: string
  companionHeaders?: Record<string, string>
  companionKeysParams?: Record<string, string>
  companionCookiesRule?: 'same-origin' | 'include'
  companionAllowedHosts?: string | RegExp | (string | RegExp)[]
}
