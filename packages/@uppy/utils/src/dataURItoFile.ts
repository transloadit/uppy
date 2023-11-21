import dataURItoBlob from './dataURItoBlob.ts'

export default function dataURItoFile(
  dataURI: string,
  opts: { mimeType?: string; name?: string },
): File | Blob {
  return dataURItoBlob(dataURI, opts, true)
}
