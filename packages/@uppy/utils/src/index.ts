// Core classes and utilities
export { default as Translator } from './Translator.js'
export type { Locale, OptionalPluralizeLocale, LocaleStrings, I18n } from './Translator.js'

export { default as ProgressTimeout } from './ProgressTimeout.js'

export {
  RateLimitedQueue,
  type AbortablePromise,
  internalRateLimitedQueue
} from './RateLimitedQueue.js'

// Canvas and data URI utilities
export { default as canvasToBlob } from './canvasToBlob.js'
export { default as dataURItoBlob } from './dataURItoBlob.js'
export { default as dataURItoFile } from './dataURItoFile.js'

// Math and filtering utilities
export { default as emaFilter } from './emaFilter.js'

// DOM utilities
export { default as findAllDOMElements } from './findAllDOMElements.js'
export { default as findDOMElement } from './findDOMElement.js'
export { default as isDOMElement } from './isDOMElement.js'
export { default as isDragDropSupported } from './isDragDropSupported.js'
export { default as isPreviewSupported } from './isPreviewSupported.js'
export { default as isTouchDevice } from './isTouchDevice.js'

// File utilities
export { default as generateFileID, getSafeFileId } from './generateFileID.js'
export { default as getFileNameAndExtension } from './getFileNameAndExtension.js'
export { default as getFileType } from './getFileType.js'
export { default as getFileTypeExtension } from './getFileTypeExtension.js'

// Progress and time utilities
export { default as getBytesRemaining } from './getBytesRemaining.js'
export { default as getETA } from './getETA.js'
export { default as getSpeed } from './getSpeed.js'
export { default as getTimeStamp } from './getTimeStamp.js'
export { default as prettyETA } from './prettyETA.js'
export { default as secondsToTime } from './secondsToTime.js'

// Network utilities
export { default as getSocketHost } from './getSocketHost.js'
export { default as isObjectURL } from './isObjectURL.js'

// Array utilities
export { default as toArray } from './toArray.js'

// Constants
export { default as FOCUSABLE_ELEMENTS } from './FOCUSABLE_ELEMENTS.js'

// AbortController utilities
export {
  AbortController,
  AbortSignal,
  createAbortError
} from './AbortController.js'

// Text utilities
export { default as getTextDirection } from './getTextDirection.js'
export { default as truncateString } from './truncateString.js'

// Network error handling
export { default as NetworkError } from './NetworkError.js'
export { default as isNetworkError } from './isNetworkError.js'
export { default as fetchWithNetworkError } from './fetchWithNetworkError.js'

// File transformation utilities
export { default as remoteFileObjToLocal } from './remoteFileObjToLocal.js'

// Error utilities
export { default as ErrorWithCause } from './ErrorWithCause.js'

// Async utilities
export { default as delay } from './delay.js'

// Object utilities
export { default as hasProperty } from './hasProperty.js'

// MIME types
export { default as mimeTypes } from './mimeTypes.js'

// File drop utilities
export { default as getDroppedFiles } from './getDroppedFiles/index.js'

// File filtering utilities
export {
  filterNonFailedFiles,
  filterFilesToEmitUploadStarted
} from './fileFilters.js'

// Virtual list component
export { default as VirtualList } from './VirtualList.jsx'

// Type definitions and interfaces
export type {
  UppyFile,
  MinimalRequiredUppyFile,
  InternalMetadata,
  TagFile
} from './UppyFile.js'

export type { CompanionFile } from './CompanionFile.js'

export type {
  CompanionClientProvider,
  CompanionClientSearchProvider,
  RequestOptions
} from './CompanionClientProvider.js'

export type {
  FileProgress,
  FileProgressStarted,
  FileProgressNotStarted,
  FileProcessingInfo,
  DeterminateFileProcessing,
  IndeterminateFileProcessing
} from './FileProgress.js'

export { default as UserFacingApiError } from './UserFacingApiError.js'

export { default as getAllowedMetaFields } from './getAllowedMetaFields.js'

export {
  fetcher,
  type FetcherOptions
} from './fetcher.js'
