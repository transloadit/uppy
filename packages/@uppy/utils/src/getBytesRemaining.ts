export type FileProgress = {
  bytesTotal: number
  bytesUploaded: number
}

export default function getBytesRemaining (fileProgress: FileProgress) {
  return fileProgress.bytesTotal - fileProgress.bytesUploaded
}
