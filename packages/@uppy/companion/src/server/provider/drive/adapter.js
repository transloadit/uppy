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
  return item.mimeType === 'application/vnd.google-apps.folder' || item.kind === 'drive#teamDrive'
}

exports.getItemData = (item) => {
  return Object.assign({}, item, { size: parseFloat(item.size) })
}

exports.getItemIcon = (item) => {
  if (item.kind === 'drive#teamDrive') {
    return item.backgroundImageLink + '=w16-h16-n'
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
  // If it's from a Team Drive, add the Team Drive ID as a query param.
  // The server needs the Team Drive ID to list files in a Team Drive folder.
  if (item.teamDriveId) {
    return item.id + `?teamDriveId=${item.teamDriveId}`
  }

  return item.id
}

exports.getItemModifiedDate = (item) => {
  return item.modifiedTime
}

exports.getItemThumbnailUrl = (item) => {
  return `/drive/thumbnail/${exports.getItemRequestPath(item)}`
}

exports.isTeamDrive = (item) => {
  return item.kind === 'drive#teamDrive'
}
