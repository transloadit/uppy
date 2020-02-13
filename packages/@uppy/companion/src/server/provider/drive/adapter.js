const querystring = require('querystring')

exports.getUsername = (data) => {
  for (const item of data.files) {
    if (item.ownedByMe) {
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

  if (item.thumbnailLink) {
    const smallerThumbnailLink = item.thumbnailLink.replace('s220', 's40')
    return smallerThumbnailLink
  }

  return item.iconLink
}

exports.getItemSubList = (item) => {
  return item.files.filter((i) => {
    return exports.isFolder(i) || !i.mimeType.startsWith('application/vnd.google')
  })
}

exports.getItemName = (item) => {
  return item.name ? item.name : '/'
}

exports.getMimeType = (item) => {
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
