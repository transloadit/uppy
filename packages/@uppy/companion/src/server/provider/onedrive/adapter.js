const querystring = require('querystring')

exports.isFolder = (item) => {
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
  return item.id
}

exports.getItemRequestPath = (item) => {
  return exports.getItemId(item)
}

exports.getItemModifiedDate = (item) => {
  return item.fileSystemInfo.lastModifiedDateTime
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
