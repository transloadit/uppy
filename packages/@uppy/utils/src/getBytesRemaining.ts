import type { FileProgress } from './FileProgress.js'

export default function getBytesRemaining(fileProgress: FileProgress): number {
  if (fileProgress.bytesTotal == null) return 0
  return fileProgress.bytesTotal - (fileProgress.bytesUploaded as number)
}
