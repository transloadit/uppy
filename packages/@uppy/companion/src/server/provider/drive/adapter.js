const querystring = require('node:querystring')

// @todo use the "about" endpoint to get the username instead
// see: https://developers.google.com/drive/api/v2/reference/about/get
const getUsername = (data) => {
  for (const item of data.files) {
    if (item.ownedByMe && item.permissions) {
      for (const permission of item.permissions) {
        if (permission.role === 'owner') {
          return permission.emailAddress
        }
      }
    }
  }
  return undefined
}

exports.isGsuiteFile = (mimeType) => {
  return mimeType && mimeType.startsWith('application/vnd.google')
}

const isSharedDrive = (item) => {
  return item.kind === 'drive#drive'
}

const isFolder = (item) => {
  return item.mimeType === 'application/vnd.google-apps.folder' || isSharedDrive(item)
}

exports.isShortcut = (mimeType) => {
  return mimeType === 'application/vnd.google-apps.shortcut'
}

const getItemSize = (item) => {
  return parseInt(item.size, 10)
}

const getItemIcon = (item) => {
  if (isSharedDrive(item)) {
    const size = '=w16-h16-n'
    const sizeParamRegex = /=[-whncsp0-9]*$/
    return item.backgroundImageLink.match(sizeParamRegex)
      ? item.backgroundImageLink.replace(sizeParamRegex, size)
      : `${item.backgroundImageLink}${size}`
  }

  if (item.thumbnailLink && !item.mimeType.startsWith('application/vnd.google')) {
    const smallerThumbnailLink = item.thumbnailLink.replace('s220', 's40')
    return smallerThumbnailLink
  }

  return item.iconLink
}

const getItemSubList = (item) => {
  const allowedGSuiteTypes = [
    'application/vnd.google-apps.document',
    'application/vnd.google-apps.drawing',
    'application/vnd.google-apps.script',
    'application/vnd.google-apps.spreadsheet',
    'application/vnd.google-apps.presentation',
    'application/vnd.google-apps.shortcut',
  ]

  return item.files.filter((i) => {
    return isFolder(i) || !exports.isGsuiteFile(i.mimeType) || allowedGSuiteTypes.includes(i.mimeType)
  })
}

const getItemName = (item) => {
  const extensionMaps = {
    'application/vnd.google-apps.document': '.docx',
    'application/vnd.google-apps.drawing': '.png',
    'application/vnd.google-apps.script': '.json',
    'application/vnd.google-apps.spreadsheet': '.xlsx',
    'application/vnd.google-apps.presentation': '.ppt',
  }

  const extension = extensionMaps[item.mimeType]
  if (extension && item.name && !item.name.endsWith(extension)) {
    return item.name + extension
  }

  return item.name ? item.name : '/'
}

exports.getGsuiteExportType = (mimeType) => {
  const typeMaps = {
    'application/vnd.google-apps.document': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.google-apps.drawing': 'image/png',
    'application/vnd.google-apps.script': 'application/vnd.google-apps.script+json',
    'application/vnd.google-apps.spreadsheet': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.google-apps.presentation': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  }

  return typeMaps[mimeType] || 'application/pdf'
}

function getMimeType2 (mimeType) {
  if (exports.isGsuiteFile(mimeType)) {
    return exports.getGsuiteExportType(mimeType)
  }
  return mimeType
}

const getMimeType = (item) => {
  if (exports.isShortcut(item.mimeType)) {
    return getMimeType2(item.shortcutDetails.targetMimeType)
  }
  return getMimeType2(item.mimeType)
}

const getItemId = (item) => {
  return item.id
}

const getItemRequestPath = (item) => {
  return item.id
}

const getItemModifiedDate = (item) => {
  return item.modifiedTime
}

const getItemThumbnailUrl = (item) => {
  return item.thumbnailLink
}

const getNextPagePath = (data, currentQuery, currentPath) => {
  if (!data.nextPageToken) {
    return null
  }
  const query = { ...currentQuery, cursor: data.nextPageToken }
  return `${currentPath}?${querystring.stringify(query)}`
}

const getImageHeight = (item) => item.imageMediaMetadata && item.imageMediaMetadata.height

const getImageWidth = (item) => item.imageMediaMetadata && item.imageMediaMetadata.width

const getImageRotation = (item) => item.imageMediaMetadata && item.imageMediaMetadata.rotation

const getImageDate = (item) => item.imageMediaMetadata && item.imageMediaMetadata.date

const getVideoHeight = (item) => item.videoMediaMetadata && item.videoMediaMetadata.height

const getVideoWidth = (item) => item.videoMediaMetadata && item.videoMediaMetadata.width

const getVideoDurationMillis = (item) => item.videoMediaMetadata && item.videoMediaMetadata.durationMillis

// Hopefully this name will not be used by Google
exports.VIRTUAL_SHARED_DIR = 'shared-with-me'

exports.adaptData = (listFilesResp, sharedDrivesResp, directory, query, showSharedWithMe) => {
  const adaptItem = (item) => ({
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
  const virtualItem = showSharedWithMe && ({
    isFolder: true,
    icon: 'folder',
    name: 'Shared with me',
    mimeType: 'application/vnd.google-apps.folder',
    id: exports.VIRTUAL_SHARED_DIR,
    requestPath: exports.VIRTUAL_SHARED_DIR,
  })

  const adaptedItems = [
    ...(virtualItem ? [virtualItem] : []), // shared folder first
    ...([...sharedDrives, ...items].map(adaptItem)),
  ]

  return {
    username: getUsername(listFilesResp),
    items: adaptedItems,
    nextPagePath: getNextPagePath(listFilesResp, query, directory),
  }
}
