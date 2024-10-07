/**
 * Manages communications with Companion
 */

export { default as RequestClient } from './RequestClient.ts'
export { default as Provider } from './Provider.ts'
export { default as SearchProvider } from './SearchProvider.ts'

export { default as getAllowedHosts } from './getAllowedHosts.ts'

export * as tokenStorage from './tokenStorage.ts'

export type { CompanionPluginOptions } from './CompanionPluginOptions.ts'
