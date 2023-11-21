export interface Chunk {
  getData: () => Blob
  onProgress: (ev: ProgressEvent) => void
  onComplete: (etag: string) => void
  shouldUseMultipart: boolean
  setAsUploaded?: () => void
}
