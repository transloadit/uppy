const getFileNameAndExtension = require('@uppy/utils/lib/getFileNameAndExtension')

module.exports = function remoteFileObjToLocal (file) {
  return {
    ...file,
    type: file.mimeType,
    extension: getFileNameAndExtension(file.name).extension
  }
}
