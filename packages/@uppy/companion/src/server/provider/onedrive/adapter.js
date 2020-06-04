const querystring = require('querystring')

exports.isFolder = (item) => {
  if (item.remoteItem) {
    return !!item.remoteItem.folder
  }

  return !!item.folder
}

exports.getItemSize = (item) => {
  return item.size
}

exports.getItemIcon = (item) => {
  return exports.isFolder(item) ? 'folder' : exports.getItemThumbnailUrl(item)
}

exports.getItemSubList = (item) => {
  return item.value
}

exports.getItemName = (item) => {
  return item.name || ''
}

exports.getMimeType = (item) => {
  return item.file ? item.file.mimeType : null
}

exports.getItemId = (item) => {
  if (item.remoteItem) {
    return item.remoteItem.id
  }
  return item.id
}

exports.getItemRequestPath = (item) => {
  let query = `?driveId=${item.parentReference.driveId}`
  if (item.remoteItem) {
    query = `?driveId=${item.remoteItem.parentReference.driveId}`
  }
  return exports.getItemId(item) + query
}

exports.getItemModifiedDate = (item) => {
  return item.lastModifiedDateTime
}

exports.getItemThumbnailUrl = (item) => {
  return item.thumbnails[0] ? item.thumbnails[0].medium.url : null
}

exports.getNextPagePath = (data) => {
  if (!data['@odata.nextLink']) {
    return null
  }

  const query = { cursor: querystring.parse(data['@odata.nextLink']).$skiptoken }
  return `?${querystring.stringify(query)}`
}
