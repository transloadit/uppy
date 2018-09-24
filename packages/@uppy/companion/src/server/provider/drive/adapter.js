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
  return item.mimeType === 'application/vnd.google-apps.folder'
}

exports.getItemData = (item) => {
  return Object.assign({}, item, { size: parseFloat(item.size) })
}

exports.getItemIcon = (item) => {
  return item.iconLink
}

exports.getItemSubList = (item) => {
  return item.files.filter((i) => {
    return this.isFolder(i) || !i.mimeType.startsWith('application/vnd.google')
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
    item.id += `?teamDriveId=${item.teamDriveId}`
    delete item.teamDriveId
  }

  return this.getItemId(item)
}

exports.getItemModifiedDate = (item) => {
  return item.modifiedTime
}

exports.getItemThumbnailUrl = (item) => {
  return `${this.opts.serverUrl}/${this.GoogleDrive.id}/thumbnail/${this.getItemRequestPath(item)}`
}
