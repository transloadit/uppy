const mime = require('mime-types')
const querystring = require('querystring')

exports.isFolder = (item) => {
  return item.type === 'folder'
}

exports.getItemSize = (item) => {
  return item.size
}

exports.getItemIcon = (item) => {
  return item.type
}

exports.getItemSubList = (item) => {
  return item.entries
}

exports.getItemName = (item) => {
  return item.name || ''
}

exports.getMimeType = (item) => {
  return mime.lookup(exports.getItemName(item)) || null
}

exports.getItemId = (item) => {
  return item.id
}

exports.getItemRequestPath = (item) => {
  return item.id
}

exports.getItemModifiedDate = (item) => {
  return item.modified_at
}

exports.getItemThumbnailUrl = (item) => {
  return `/box/thumbnail/${exports.getItemRequestPath(item)}`
}

exports.getNextPagePath = (data) => {
  if (data.total_count < data.limit || data.offset + data.limit > data.total_count) {
    return null
  }
  const query = { cursor: data.offset + data.limit }
  return `?${querystring.stringify(query)}`
}
