/**
 * Manages communications with Companion
 */

export { default as RequestClient } from './RequestClient'
export { default as Provider } from './Provider'
export { default as SearchProvider } from './SearchProvider'

export { default as getAllowedHosts } from './getAllowedHosts'

export * as tokenStorage from './tokenStorage'

export type { CompanionPluginOptions } from './CompanionPluginOptions'
