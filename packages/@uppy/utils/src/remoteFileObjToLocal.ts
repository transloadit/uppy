import getFileNameAndExtension from './getFileNameAndExtension.js'

interface ObjectWithMIMEAndName {
  name?: string
  mimeType: unknown
}

export default function remoteFileObjToLocal<T extends ObjectWithMIMEAndName>(
  file: T,
): T & {
  type: T['mimeType']
  extension: string | undefined | null
} {
  return {
    ...file,
    type: file.mimeType,
    extension: file.name ? getFileNameAndExtension(file.name).extension : null,
  }
}
