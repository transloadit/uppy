import getSpeed from './getSpeed.ts'
import getBytesRemaining from './getBytesRemaining.ts'
import type { FileProgress } from './FileProgress.ts'

export default function getETA(fileProgress: FileProgress): number {
  if (!fileProgress.bytesUploaded) return 0

  const uploadSpeed = getSpeed(fileProgress)
  const bytesRemaining = getBytesRemaining(fileProgress)
  const secondsRemaining = Math.round((bytesRemaining / uploadSpeed) * 10) / 10

  return secondsRemaining
}
