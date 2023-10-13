import type { FileProgress } from './FileProgress'

export default function getBytesRemaining(fileProgress: FileProgress): number {
  return fileProgress.bytesTotal - (fileProgress.bytesUploaded as number)
}
