import getFileNameAndExtension from './getFileNameAndExtension.ts'

export default function remoteFileObjToLocal (file) {
  return {
    ...file,
    type: file.mimeType,
    extension: file.name ? getFileNameAndExtension(file.name).extension : null,
  }
}
