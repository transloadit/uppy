const querystring = require('node:querystring')

const isFolder = (item) => {
  return !!item.type
}

exports.sortImages = (images) => {
  // sort in ascending order of dimension
  return images.slice().sort((a, b) => a.width - b.width)
}

const getItemIcon = (item) => {
  if (isFolder(item)) {
    return 'folder'
  }
  return exports.sortImages(item.images)[0].source
}

const getItemSubList = (item) => {
  return item.data
}

const getItemName = (item) => {
  return item.name || `${item.id} ${item.created_time}`
}

const getMimeType = (item) => {
  return isFolder(item) ? null : 'image/jpeg'
}

const getItemId = (item) => {
  return `${item.id}`
}

const getItemRequestPath = (item) => {
  return `${item.id}`
}

const getItemModifiedDate = (item) => {
  return item.created_time
}

const getItemThumbnailUrl = (item) => {
  return isFolder(item) ? null : exports.sortImages(item.images)[0].source
}

const getNextPagePath = (data, currentQuery, currentPath) => {
  if (!data.paging || !data.paging.cursors) {
    return null
  }

  const query = { ...currentQuery, cursor: data.paging.cursors.after }
  return `${currentPath || ''}?${querystring.stringify(query)}`
}

exports.adaptData = (res, username, directory, currentQuery) => {
  const data = { username, items: [] }
  const items = getItemSubList(res)
  items.forEach((item) => {
    data.items.push({
      isFolder: isFolder(item),
      icon: getItemIcon(item),
      name: getItemName(item),
      mimeType: getMimeType(item),
      size: null,
      id: getItemId(item),
      thumbnail: getItemThumbnailUrl(item),
      requestPath: getItemRequestPath(item),
      modifiedDate: getItemModifiedDate(item),
    })
  })

  data.nextPagePath = getNextPagePath(res, currentQuery, directory)
  return data
}
