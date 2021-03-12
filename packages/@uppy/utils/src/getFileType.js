const getFileNameAndExtension = require('./getFileNameAndExtension')
const mimeTypes = require('./mimeTypes')

module.exports = function getFileType (file) {
  let fileExtension = file.name ? getFileNameAndExtension(file.name).extension : null
  fileExtension = fileExtension ? fileExtension.toLowerCase() : null

  if (file.type) {
    // if mime type is set in the file object already, use that
    return file.type
  } else if (fileExtension && mimeTypes[fileExtension]) {
    // else, see if we can map extension to a mime type
    return mimeTypes[fileExtension]
  } else {
    // if all fails, fall back to a generic byte stream type
    return 'application/octet-stream'
  }
}
