// Core classes and utilities

// AbortController utilities
export {
  AbortController,
  AbortSignal,
  createAbortError,
} from './AbortController.js'
export type {
  CompanionClientProvider,
  CompanionClientSearchProvider,
  RequestOptions,
} from './CompanionClientProvider.js'
export type { CompanionFile } from './CompanionFile.js'
// Canvas and data URI utilities
export { default as canvasToBlob } from './canvasToBlob.js'
export { default as dataURItoBlob } from './dataURItoBlob.js'
export { default as dataURItoFile } from './dataURItoFile.js'
// Async utilities
export { default as delay } from './delay.js'
// Error utilities
export { default as ErrorWithCause } from './ErrorWithCause.js'
// Math and filtering utilities
export { default as emaFilter } from './emaFilter.js'
export type {
  DeterminateFileProcessing,
  FileProcessingInfo,
  FileProgress,
  FileProgressNotStarted,
  FileProgressStarted,
  IndeterminateFileProcessing,
} from './FileProgress.js'
// Constants
export { default as FOCUSABLE_ELEMENTS } from './FOCUSABLE_ELEMENTS.js'
export {
  type FetcherOptions,
  fetcher,
} from './fetcher.js'
export { default as fetchWithNetworkError } from './fetchWithNetworkError.js'
// File filtering utilities
export {
  filterFilesToEmitUploadStarted,
  filterNonFailedFiles,
} from './fileFilters.js'
// DOM utilities
export { default as findAllDOMElements } from './findAllDOMElements.js'
export { default as findDOMElement } from './findDOMElement.js'
// File utilities
export { default as generateFileID, getSafeFileId } from './generateFileID.js'
export { default as getAllowedMetaFields } from './getAllowedMetaFields.js'

// Progress and time utilities
export { default as getBytesRemaining } from './getBytesRemaining.js'
// File drop utilities
export { default as getDroppedFiles } from './getDroppedFiles/index.js'
export { default as getETA } from './getETA.js'
export { default as getFileNameAndExtension } from './getFileNameAndExtension.js'
export { default as getFileType } from './getFileType.js'
export { default as getFileTypeExtension } from './getFileTypeExtension.js'

// Network utilities
export { default as getSocketHost } from './getSocketHost.js'
export { default as getSpeed } from './getSpeed.js'
// Text utilities
export { default as getTextDirection } from './getTextDirection.js'
export { default as getTimeStamp } from './getTimeStamp.js'
// Object utilities
export { default as hasProperty } from './hasProperty.js'
export { default as isDOMElement } from './isDOMElement.js'
export { default as isDragDropSupported } from './isDragDropSupported.js'
export { default as isNetworkError } from './isNetworkError.js'
export { default as isObjectURL } from './isObjectURL.js'
export { default as isPreviewSupported } from './isPreviewSupported.js'
export { default as isTouchDevice } from './isTouchDevice.js'
// MIME types
export { default as mimeTypes } from './mimeTypes.js'
// Network error handling
export { default as NetworkError } from './NetworkError.js'
export { default as ProgressTimeout } from './ProgressTimeout.js'
export { default as prettyETA } from './prettyETA.js'
export {
  type AbortablePromise,
  internalRateLimitedQueue,
  RateLimitedQueue,
  type WrapPromiseFunctionType,
} from './RateLimitedQueue.js'
// File transformation utilities
export { default as remoteFileObjToLocal } from './remoteFileObjToLocal.js'
export { default as secondsToTime } from './secondsToTime.js'
export type {
  I18n,
  Locale,
  LocaleStrings,
  OptionalPluralizeLocale,
} from './Translator.js'
export { default as Translator } from './Translator.js'
// Array utilities
export { default as toArray } from './toArray.js'
export { default as truncateString } from './truncateString.js'
// Type definitions and interfaces
export type {
  Body,
  InternalMetadata,
  Meta,
  MinimalRequiredUppyFile,
  TagFile,
  UppyFile,
} from './UppyFile.js'
export { default as UserFacingApiError } from './UserFacingApiError.js'
// Virtual list component
export { default as VirtualList } from './VirtualList.jsx'
