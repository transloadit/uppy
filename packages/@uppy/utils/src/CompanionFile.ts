/**
 * CompanionFile represents a file object returned by the Companion API.
 */
export type CompanionFile = {
  id: string
  name?: string
  /*
   * Url to the thumbnail icon
   */
  icon: string
  type: string
  mimeType: string
  extension: string
  size: number
  isFolder: boolean
  modifiedDate: string
  thumbnail?: string
  requestPath: string
  relDirPath?: string
  absDirPath?: string
  author?: {
    name?: string
    url?: string
  }
  custom?: {
    isSharedDrive: boolean
    imageHeight: number
    imageWidth: number
    imageRotation: number
    imageDateTime: string
    videoHeight: number
    videoWidth: number
    videoDurationMillis: number
  }
}
