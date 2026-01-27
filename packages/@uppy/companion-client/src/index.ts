/**
 * Manages communications with Companion
 */

export type { CompanionPluginOptions } from './CompanionPluginOptions.js'
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
} from './RequestClient.js'
export { default as SearchProvider } from './SearchProvider.js'
export * as tokenStorage from './tokenStorage.js'
