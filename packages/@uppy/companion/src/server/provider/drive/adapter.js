const querystring = require('querystring')

exports.getUsername = (data) => {
  for (const item of data.files) {
    if (item.ownedByMe && item.permissions) {
      for (const permission of item.permissions) {
        if (permission.role === 'owner') {
          return permission.emailAddress
        }
      }
    }
  }
}

exports.isFolder = (item) => {
  return item.mimeType === 'application/vnd.google-apps.folder' || exports.isSharedDrive(item)
}

exports.getItemSize = (item) => {
  return parseInt(item.size, 10)
}

exports.getItemIcon = (item) => {
  if (exports.isSharedDrive(item)) {
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

exports.getItemSubList = (item) => {
  const allowedGSuiteTypes = [
    'application/vnd.google-apps.document',
    'application/vnd.google-apps.drawing',
    'application/vnd.google-apps.script',
    'application/vnd.google-apps.spreadsheet',
    'application/vnd.google-apps.presentation'
  ]

  return item.files.filter((i) => {
    return exports.isFolder(i) || !exports.isGsuiteFile(i.mimeType) || allowedGSuiteTypes.includes(i.mimeType)
  })
}

exports.getItemName = (item) => {
  const extensionMaps = {
    'application/vnd.google-apps.document': '.docx',
    'application/vnd.google-apps.drawing': '.png',
    'application/vnd.google-apps.script': '.json',
    'application/vnd.google-apps.spreadsheet': '.xlsx',
    'application/vnd.google-apps.presentation': '.ppt'
  }

  const extension = extensionMaps[item.mimeType]
  if (extension && item.name && !item.name.endsWith(extension)) {
    return item.name + extension
  }

  return item.name ? item.name : '/'
}

exports.getMimeType = (item) => {
  if (exports.isGsuiteFile(item.mimeType)) {
    return exports.getGsuiteExportType(item.mimeType)
  }
  return item.mimeType
}

exports.getItemId = (item) => {
  return item.id
}

exports.getItemRequestPath = (item) => {
  return item.id
}

exports.getItemModifiedDate = (item) => {
  return item.modifiedTime
}

exports.getItemThumbnailUrl = (item) => {
  return item.thumbnailLink
}

exports.isSharedDrive = (item) => {
  return item.kind === 'drive#drive'
}

exports.getNextPagePath = (data, currentQuery, currentPath) => {
  if (!data.nextPageToken) {
    return null
  }
  const query = Object.assign({}, currentQuery, {
    cursor: data.nextPageToken
  })
  return `${currentPath}?${querystring.stringify(query)}`
}

exports.isGsuiteFile = (mimeType) => {
  return mimeType && mimeType.startsWith('application/vnd.google')
}

exports.getGsuiteExportType = (mimeType) => {
  const typeMaps = {
    'application/vnd.google-apps.document': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.google-apps.drawing': 'image/png',
    'application/vnd.google-apps.script': 'application/vnd.google-apps.script+json',
    'application/vnd.google-apps.spreadsheet': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.google-apps.presentation': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  }

  return typeMaps[mimeType] || 'application/pdf'
}
