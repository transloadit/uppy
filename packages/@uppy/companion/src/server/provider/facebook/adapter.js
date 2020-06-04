const querystring = require('querystring')

exports.isFolder = (item) => {
  return !!item.type
}

exports.getItemIcon = (item) => {
  if (exports.isFolder(item)) {
    return 'folder'
  }
  return exports.sortImages(item.images)[0].source
}

exports.getItemSubList = (item) => {
  return item.data
}

exports.getItemName = (item) => {
  return item.name || `${item.id} ${item.created_time}`
}

exports.getMimeType = (item) => {
  return exports.isFolder(item) ? null : 'image/jpeg'
}

exports.getItemId = (item) => {
  return `${item.id}`
}

exports.getItemRequestPath = (item) => {
  return `${item.id}`
}

exports.getItemModifiedDate = (item) => {
  return item.created_time
}

exports.getItemThumbnailUrl = (item) => {
  return exports.isFolder(item) ? null : exports.sortImages(item.images)[0].source
}

exports.getNextPagePath = (data, currentQuery, currentPath) => {
  if (!data.paging || !data.paging.cursors) {
    return null
  }

  const query = Object.assign({}, currentQuery, {
    cursor: data.paging.cursors.after
  })
  return `${currentPath || ''}?${querystring.stringify(query)}`
}

exports.sortImages = (images) => {
  // sort in ascending order of dimension
  return images.slice().sort((a, b) => a.width - b.width)
}
