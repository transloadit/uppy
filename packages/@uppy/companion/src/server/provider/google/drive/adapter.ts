import querystring from 'node:querystring'

export type DriveItem = {
  kind?: string
  mimeType?: string
  files?: DriveItem[]
  id?: string
  name?: string
  size?: string
  thumbnailLink?: string
  iconLink?: string
  backgroundImageLink?: string
  modifiedTime?: string
  shortcutDetails?: { targetMimeType?: string }
  imageMediaMetadata?: {
    height?: number
    width?: number
    rotation?: number
    date?: string
  }
  videoMediaMetadata?: {
    height?: number
    width?: number
    durationMillis?: number
  }
} & Record<string, unknown>

export type DriveListResponse = {
  files?: DriveItem[]
  nextPageToken?: string
} & Record<string, unknown>
export type DriveSharedDrivesResponse = { drives?: DriveItem[] } & Record<
  string,
  unknown
>
export type DriveAbout = { user?: { emailAddress?: string } } & Record<
  string,
  unknown
>

const getUsername = (data: DriveAbout): string => {
  return data.user?.emailAddress ?? ''
}

export const isGsuiteFile = (mimeType: string | undefined): boolean => {
  return mimeType?.startsWith('application/vnd.google')
}

const isSharedDrive = (item: DriveItem): boolean => {
  return item.kind === 'drive#drive'
}

const isFolder = (item: DriveItem): boolean => {
  return (
    item.mimeType === 'application/vnd.google-apps.folder' ||
    isSharedDrive(item)
  )
}

export const isShortcut = (mimeType: string | undefined): boolean => {
  return mimeType === 'application/vnd.google-apps.shortcut'
}

const getItemSize = (item: DriveItem): number => {
  const size = typeof item.size === 'string' ? parseInt(item.size, 10) : NaN
  return Number.isFinite(size) ? size : 0
}

const getItemIcon = (item: DriveItem): string | undefined => {
  if (isSharedDrive(item)) {
    const size = '=w16-h16-n'
    const sizeParamRegex = /=[-whncsp0-9]*$/
    const background = item.backgroundImageLink
    if (typeof background !== 'string') return undefined
    return background.match(sizeParamRegex)
      ? background.replace(sizeParamRegex, size)
      : `${background}${size}`
  }

  if (
    item.thumbnailLink &&
    typeof item.mimeType === 'string' &&
    !item.mimeType.startsWith('application/vnd.google')
  ) {
    const smallerThumbnailLink = item.thumbnailLink.replace('s220', 's40')
    return smallerThumbnailLink
  }

  return item.iconLink
}

const getItemSubList = (item: DriveListResponse): DriveItem[] => {
  const allowedGSuiteTypes = [
    'application/vnd.google-apps.document',
    'application/vnd.google-apps.drawing',
    'application/vnd.google-apps.script',
    'application/vnd.google-apps.spreadsheet',
    'application/vnd.google-apps.presentation',
    'application/vnd.google-apps.shortcut',
  ]

  const files = Array.isArray(item.files) ? item.files : []
  return files.filter((i) => {
    return (
      isFolder(i) ||
      !isGsuiteFile(i.mimeType) ||
      (typeof i.mimeType === 'string' &&
        allowedGSuiteTypes.includes(i.mimeType))
    )
  })
}

const getItemName = (item: DriveItem): string => {
  const extensionMaps: Record<string, string> = {
    'application/vnd.google-apps.document': '.docx',
    'application/vnd.google-apps.drawing': '.png',
    'application/vnd.google-apps.script': '.json',
    'application/vnd.google-apps.spreadsheet': '.xlsx',
    'application/vnd.google-apps.presentation': '.ppt',
  }

  const extension = item.mimeType ? extensionMaps[item.mimeType] : undefined
  if (extension && item.name && !item.name.endsWith(extension)) {
    return item.name + extension
  }

  return item.name ? item.name : '/'
}

export const getGsuiteExportType = (mimeType: string): string => {
  const typeMaps: Record<string, string> = {
    'application/vnd.google-apps.document':
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.google-apps.drawing': 'image/png',
    'application/vnd.google-apps.script':
      'application/vnd.google-apps.script+json',
    'application/vnd.google-apps.spreadsheet':
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.google-apps.presentation':
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  }

  return typeMaps[mimeType] || 'application/pdf'
}

function getMimeType2(mimeType: string | undefined): string | undefined {
  if (isGsuiteFile(mimeType)) {
    return getGsuiteExportType(mimeType ?? '')
  }
  return mimeType
}

const getMimeType = (item: DriveItem): string | undefined => {
  if (isShortcut(item.mimeType)) {
    return getMimeType2(item.shortcutDetails?.targetMimeType)
  }
  return getMimeType2(item.mimeType)
}

const getItemId = (item: DriveItem): string | undefined => {
  return item.id
}

const getItemRequestPath = (item: DriveItem): string | undefined => {
  return item.id
}

const getItemModifiedDate = (item: DriveItem): string | undefined => {
  return item.modifiedTime
}

const getItemThumbnailUrl = (item: DriveItem): string | undefined => {
  return item.thumbnailLink
}

const getNextPagePath = (
  data: DriveListResponse,
  currentQuery: Record<string, unknown>,
  currentPath: string,
): string | null => {
  if (!data.nextPageToken) {
    return null
  }
  const query = { ...currentQuery, cursor: data.nextPageToken }
  return `${currentPath}?${querystring.stringify(query)}`
}

const getImageHeight = (item: DriveItem) => item.imageMediaMetadata?.height

const getImageWidth = (item: DriveItem) => item.imageMediaMetadata?.width

const getImageRotation = (item: DriveItem) => item.imageMediaMetadata?.rotation

const getImageDate = (item: DriveItem) => item.imageMediaMetadata?.date

const getVideoHeight = (item: DriveItem) => item.videoMediaMetadata?.height

const getVideoWidth = (item: DriveItem) => item.videoMediaMetadata?.width

const getVideoDurationMillis = (item: DriveItem) =>
  item.videoMediaMetadata?.durationMillis

// Hopefully this name will not be used by Google
export const VIRTUAL_SHARED_DIR = 'shared-with-me'

export const adaptData = (
  listFilesResp: DriveListResponse,
  sharedDrivesResp: DriveSharedDrivesResponse | null | undefined,
  directory: string,
  query: Record<string, unknown>,
  showSharedWithMe: boolean,
  about: DriveAbout,
) => {
  const adaptItem = (item: DriveItem) => ({
    isFolder: isFolder(item),
    icon: getItemIcon(item),
    name: getItemName(item),
    mimeType: getMimeType(item),
    id: getItemId(item),
    thumbnail: getItemThumbnailUrl(item),
    requestPath: getItemRequestPath(item),
    modifiedDate: getItemModifiedDate(item),
    size: getItemSize(item),
    custom: {
      isSharedDrive: isSharedDrive(item),
      imageHeight: getImageHeight(item),
      imageWidth: getImageWidth(item),
      imageRotation: getImageRotation(item),
      imageDateTime: getImageDate(item),
      videoHeight: getVideoHeight(item),
      videoWidth: getVideoWidth(item),
      videoDurationMillis: getVideoDurationMillis(item),
    },
  })

  const items = getItemSubList(listFilesResp)
  const sharedDrives = sharedDrivesResp ? sharedDrivesResp.drives || [] : []

  // “Shared with me” is a list of shared documents,
  // not the same as sharedDrives
  const virtualItem = showSharedWithMe && {
    isFolder: true,
    icon: 'folder',
    name: 'Shared with me',
    mimeType: 'application/vnd.google-apps.folder',
    id: VIRTUAL_SHARED_DIR,
    requestPath: VIRTUAL_SHARED_DIR,
  }

  const adaptedItems = [
    ...(virtualItem ? [virtualItem] : []), // shared folder first
    ...[...sharedDrives, ...items].map(adaptItem),
  ]

  return {
    username: getUsername(about),
    items: adaptedItems,
    nextPagePath: getNextPagePath(listFilesResp, query, directory),
  }
}
