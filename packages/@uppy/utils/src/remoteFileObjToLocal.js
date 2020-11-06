const getFileNameAndExtension = require('@uppy/utils/lib/getFileNameAndExtension')

module.exports = function remoteFileObjToLocal (file) {
  return {
    ...file,
    type: file.mimeType,
    extension: file.name ? getFileNameAndExtension(file.name).extension : null
  }
}
