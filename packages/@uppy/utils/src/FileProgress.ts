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

interface FileProgressBase {
  progress?: number
  uploadComplete?: boolean
  percentage?: number
  bytesTotal: number
  preprocess?: FileProcessingInfo
  postprocess?: FileProcessingInfo
}

// FileProgress is either started or not started. We want to make sure TS doesn't
// let us mix the two cases, and for that effect, we have one type for each case:
export type FileProgressStarted = FileProgressBase & {
  uploadStarted: number
  bytesUploaded: number
  progress?: number
}
export type FileProgressNotStarted = FileProgressBase & {
  uploadStarted: null
  // TODO: remove `|0` (or maybe `false|`?)
  bytesUploaded: false | 0
}
export type FileProgress = FileProgressStarted | FileProgressNotStarted
