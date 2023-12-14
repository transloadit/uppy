interface FileProgressBase {
  progress?: number
  uploadComplete: boolean
  percentage: number
  bytesTotal: number
  preprocess?: { mode: string; message?: string; value?: number }
  postprocess?: { mode: string; message?: string; value?: number }
}

// FileProgress is either started or not started. We want to make sure TS doesn't
// let us mix the two cases, and for that effect, we have one type for each case:
export type FileProgressStarted = FileProgressBase & {
  uploadStarted: number
  bytesUploaded: number
  progress: number
}
export type FileProgressNotStarted = FileProgressBase & {
  uploadStarted: null
  bytesUploaded: false
}
export type FileProgress = FileProgressStarted | FileProgressNotStarted
