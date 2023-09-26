import dataURItoBlob from './dataURItoBlob.ts'

export default function dataURItoFile (dataURI, opts) {
  return dataURItoBlob(dataURI, opts, true)
}
