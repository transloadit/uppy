import getSpeed from './getSpeed'
import getBytesRemaining from './getBytesRemaining'
import type { FileProgress } from './FileProgress.js'

export default function getETA(fileProgress: FileProgress): number {
  if (!fileProgress.bytesUploaded) return 0

  const uploadSpeed = getSpeed(fileProgress)
  const bytesRemaining = getBytesRemaining(fileProgress)
  const secondsRemaining = Math.round((bytesRemaining / uploadSpeed) * 10) / 10

  return secondsRemaining
}
