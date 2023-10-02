export interface FileProgress {
  progress: number
  uploadStarted: number | null
  uploadComplete: boolean
  percentage: number
  bytesUploaded: number
  bytesTotal: number
}
