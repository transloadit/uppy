export interface DeterminateFileProcessing {
  mode: 'determinate'
  message: string
  value: number
}
export interface IndeterminateFileProcessing {
  mode: 'indeterminate'
  message?: string
  value?: 0
}
export type FileProcessingInfo =
  | IndeterminateFileProcessing
  | DeterminateFileProcessing

// TODO explore whether all of these properties need to be optional
interface FileProgressBase {
  /**
   * When `uploadComplete` is `true`, the upload has completed successfully (no error).
   * This is a bit confusing, because elsewhere in the code, we use the term "complete" when we mean an upload has completed either with success or failure.
   * Note that it does not mean that post-processing steps are done, for example a Transloadit assembly may still be running.
   * TODO rename to `uploadSuccess` or similar
   */
  uploadComplete?: boolean
  /**
   * When `true`, the file upload completed uploading *and* post-processing (if post-processing steps exit) either successfully or failed.
   */
  complete?: true
  /** `undefined` if we don't know the percentage (e.g. for files with `bytesTotal` null) */
  percentage?: number
  /**
   * note that Companion will send `bytesTotal` 0 if unknown size (not `null`).
   * this is not perfect because some files can actually have a size of 0,
   * and then we might think those files have an unknown size
   * todo we should change this in companion
   */
  bytesTotal: number | null
  preprocess?: FileProcessingInfo
  postprocess?: FileProcessingInfo
}

// FileProgress is either started or not started. We want to make sure TS doesn't
// let us mix the two cases, and for that effect, we have one type for each case:
export type FileProgressStarted = FileProgressBase & {
  uploadStarted: number
  bytesUploaded: number
}
export type FileProgressNotStarted = FileProgressBase & {
  uploadStarted: null
  bytesUploaded: false
}
export type FileProgress = FileProgressStarted | FileProgressNotStarted
