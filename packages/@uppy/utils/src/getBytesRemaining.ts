export default function getBytesRemaining (fileProgress: {
  bytesTotal: number
  bytesUploaded: number
}) {
  return fileProgress.bytesTotal - fileProgress.bytesUploaded
}
