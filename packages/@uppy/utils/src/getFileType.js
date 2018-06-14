const getFileNameAndExtension = require('./getFileNameAndExtension')
const mimeTypes = require('./mimeTypes')

module.exports = function getFileType (file) {
  const fileExtension = file.name ? getFileNameAndExtension(file.name).extension : null

  if (file.isRemote) {
    // some remote providers do not support file types
    return file.type ? file.type : mimeTypes[fileExtension]
  }

  // check if mime type is set in the file object
  if (file.type) {
    return file.type
  }

  // see if we can map extension to a mime type
  if (fileExtension && mimeTypes[fileExtension]) {
    return mimeTypes[fileExtension]
  }

  // if all fails, well, return empty
  return null
}
