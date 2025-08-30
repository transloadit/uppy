/**
 * Manages communications with Companion
 */

export type { CompanionPluginOptions } from './CompanionPluginOptions.js'
export { default as getAllowedHosts } from './getAllowedHosts.js'
export { default as Provider } from './Provider.js'
export { default as RequestClient } from './RequestClient.js'
export { default as SearchProvider } from './SearchProvider.js'
export * as tokenStorage from './tokenStorage.js'

// Export error classes that users might need to catch
export { default as AuthError } from './AuthError.js'
