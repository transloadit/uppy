import dataURItoBlob from './dataURItoBlob.js'

export default function dataURItoFile (dataURI, opts) {
  return dataURItoBlob(dataURI, opts, true)
}
