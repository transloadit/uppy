const mime = require('mime-types')
const querystring = require('node:querystring')

const isFolder = (item) => {
  return item.type === 'folder'
}

const getItemSize = (item) => {
  return item.size
}

const getItemIcon = (item) => {
  return item.type
}

const getItemSubList = (item) => {
  return item.entries
}

const getItemName = (item) => {
  return item.name || ''
}

const getMimeType = (item) => {
  return mime.lookup(getItemName(item)) || null
}

const getItemId = (item) => {
  return item.id
}

const getItemRequestPath = (item) => {
  return item.id
}

const getItemModifiedDate = (item) => {
  return item.modified_at
}

const getItemThumbnailUrl = (item) => {
  return `/box/thumbnail/${getItemRequestPath(item)}`
}

const getNextPagePath = (data) => {
  if (data.total_count < data.limit || data.offset + data.limit > data.total_count) {
    return null
  }
  const query = { cursor: data.offset + data.limit }
  return `?${querystring.stringify(query)}`
}

module.exports = function adaptData (res, username, companion) {
  const data = { username, items: [] }
  const items = getItemSubList(res)
  items.forEach((item) => {
    data.items.push({
      isFolder: isFolder(item),
      icon: getItemIcon(item),
      name: getItemName(item),
      mimeType: getMimeType(item),
      id: getItemId(item),
      thumbnail: companion.buildURL(getItemThumbnailUrl(item), true),
      requestPath: getItemRequestPath(item),
      modifiedDate: getItemModifiedDate(item),
      size: getItemSize(item),
    })
  })

  data.nextPagePath = getNextPagePath(res)

  return data
}
