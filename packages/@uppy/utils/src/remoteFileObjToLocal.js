import getFileNameAndExtension from './getFileNameAndExtension.js'

export default function remoteFileObjToLocal (file) {
  return {
    ...file,
    type: file.mimeType,
    extension: file.name ? getFileNameAndExtension(file.name).extension : null,
  }
}
