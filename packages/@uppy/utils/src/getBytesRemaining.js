export default function getBytesRemaining (fileProgress) {
  return fileProgress.bytesTotal - fileProgress.bytesUploaded
}
