/**
 * Manages communications with Companion
 */

export { isAuthError } from './AuthError.js'
export type { CompanionPluginOptions } from './CompanionPluginOptions.js'
export { defaultStorage } from './defaultStorage.js'
export type { CompanionErrorCode } from './errorCodes.js'
export { default as getAllowedHosts } from './getAllowedHosts.js'
export type {
  GooglePickerOptions,
  GooglePickerState,
  GooglePickerType,
  MediaItem,
  MediaItemBase,
  PhotoMediaItem,
  PickedDriveItem,
  PickedItemBase,
  PickedPhotosItem,
  PickingSession,
  UnspecifiedMediaItem,
  VideoMediaItem,
} from './googlePicker.js'
export {
  createGooglePickerController,
  createGooglePickerStoreAdapter,
  InvalidTokenError,
} from './googlePicker.js'
export { default as Provider } from './Provider.js'
export {
  default as RequestClient,
  type Opts as RequestClientOptions,
  type RequestOptions,
} from './RequestClient.js'
export { default as SearchProvider } from './SearchProvider.js'

import * as deprecatedTokenStorage from './tokenStorage.js'

/**
 * @deprecated
 *   Use `defaultStorage` instead.
 */
export const tokenStorage = deprecatedTokenStorage
