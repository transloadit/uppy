import getFileNameAndExtension from './getFileNameAndExtension.js'
import mimeTypes from './mimeTypes.js'

export default function getFileType (file) {
  if (file.type) return file.type

  const fileExtension = file.name ? getFileNameAndExtension(file.name).extension?.toLowerCase() : null
  if (fileExtension && fileExtension in mimeTypes) {
    // else, see if we can map extension to a mime type
    return mimeTypes[fileExtension]
  }
  // if all fails, fall back to a generic byte stream type
  return 'application/octet-stream'
}
